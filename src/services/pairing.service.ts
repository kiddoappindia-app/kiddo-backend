import crypto from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { Activity } from '../models/activity.model.js';
import { Family } from '../models/family.model.js';
import { PairingToken } from '../models/pairing-token.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

const QR_EXPIRY_MINUTES = 15;
const CODE_EXPIRY_MINUTES = 60;

export async function generatePairingCode(familyId: string, parentId: string) {
  const family = await Family.findById(familyId);
  if (!family) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Family not found');
  }

  await PairingToken.updateMany(
    { familyId, type: 'code', status: 'active' },
    { status: 'expired' },
  );

  const code = PairingToken.generateCode();
  const token = PairingToken.generateToken();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  const pairingToken = await PairingToken.create({
    familyId,
    createdBy: parentId,
    token,
    code,
    type: 'code',
    expiresAt,
    maxUses: 5,
  });

  return {
    code: pairingToken.code,
    expiresAt: pairingToken.expiresAt,
    familyId,
  };
}

export async function generatePairingQr(familyId: string, parentId: string) {
  const family = await Family.findById(familyId);
  if (!family) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Family not found');
  }

  await PairingToken.updateMany(
    { familyId, type: 'qr', status: 'active' },
    { status: 'expired' },
  );

  const token = PairingToken.generateToken();
  const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);

  const qrPayload = {
    v: 1,
    familyId,
    token,
    exp: expiresAt.getTime(),
    sig: crypto
      .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'kiddo-qr-secret')
      .update(`${familyId}:${token}:${expiresAt.getTime()}`)
      .digest('hex'),
  };

  const pairingToken = await PairingToken.create({
    familyId,
    createdBy: parentId,
    token,
    type: 'qr',
    expiresAt,
    maxUses: 1,
    metadata: { qrPayload },
  });

  return {
    qrData: Buffer.from(JSON.stringify(qrPayload)).toString('base64'),
    pairingId: String(pairingToken._id),
    expiresAt: pairingToken.expiresAt,
    familyId,
  };
}

export async function validatePairingCode(code: string, childUserId: string) {
  const normalizedCode = code.trim().toUpperCase();
  const pairingToken = await PairingToken.findOne({
    code: normalizedCode,
    type: 'code',
    status: 'active',
  });

  if (!pairingToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired pairing code');
  }

  if (!pairingToken.canUse()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This pairing code has expired or been fully used');
  }

  const child = await User.findById(childUserId);
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child account not found');
  }

  if (child.familyId && String(child.familyId) === String(pairingToken.familyId)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Child is already part of this family');
  }

  if (child.familyId) {
    throw new ApiError(StatusCodes.CONFLICT, 'Child is already linked to another family. Unlink first.');
  }

  child.familyId = pairingToken.familyId;
  child.parentId = pairingToken.createdBy;
  await child.save();

  await pairingToken.markUsed(childUserId);

  await Activity.create({
    familyId: pairingToken.familyId,
    actorId: childUserId,
    type: 'child_added',
    message: `"${child.firstName}" joined the family via pairing code`,
    metadata: { childId: childUserId, method: 'code' },
  });

  const family = await Family.findById(pairingToken.familyId);

  return {
    success: true,
    family: {
      id: String(family!._id),
      name: family!.name,
      familyCode: family!.familyCode,
    },
  };
}

export async function validatePairingQr(qrData: string, childUserId: string) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(qrData, 'base64').toString());
  } catch {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid QR code data');
  }

  const { familyId, token, exp, sig } = parsed;

  if (!familyId || !token || !exp || !sig) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid QR code structure');
  }

  if (Date.now() > exp) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'QR code has expired');
  }

  const expectedSig = crypto
    .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'kiddo-qr-secret')
    .update(`${familyId}:${token}:${exp}`)
    .digest('hex');

  if (sig !== expectedSig) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid QR code signature');
  }

  const pairingToken = await PairingToken.findOne({
    familyId,
    token,
    type: 'qr',
    status: 'active',
  });

  if (!pairingToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'QR code has already been used or revoked');
  }

  if (!pairingToken.canUse()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'QR code is no longer valid');
  }

  const child = await User.findById(childUserId);
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child account not found');
  }

  if (child.familyId && String(child.familyId) === String(familyId)) {
    throw new ApiError(StatusCodes.CONFLICT, 'Child is already part of this family');
  }

  if (child.familyId) {
    throw new ApiError(StatusCodes.CONFLICT, 'Child is already linked to another family. Unlink first.');
  }

  child.familyId = pairingToken.familyId;
  child.parentId = pairingToken.createdBy;
  await child.save();

  await pairingToken.markUsed(childUserId);

  await Activity.create({
    familyId: pairingToken.familyId,
    actorId: childUserId,
    type: 'child_added',
    message: `"${child.firstName}" joined the family via QR code`,
    metadata: { childId: childUserId, method: 'qr' },
  });

  const family = await Family.findById(familyId);

  return {
    success: true,
    family: {
      id: String(family!._id),
      name: family!.name,
      familyCode: family!.familyCode,
    },
  };
}

export async function revokePairingTokens(familyId: string) {
  await PairingToken.updateMany(
    { familyId, status: 'active' },
    { status: 'revoked' },
  );
}

export async function getActivePairingTokens(familyId: string) {
  return PairingToken.find({
    familyId,
    status: 'active',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
}
