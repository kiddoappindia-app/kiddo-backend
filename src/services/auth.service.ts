import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { nanoid } from 'nanoid';
import { ROLES, type Role } from '../constants/roles.js';
import { env } from '../config/env.js';
import { verifyFirebaseIdToken, setFirebaseCustomClaims } from '../config/firebase-admin.js';
import { Activity } from '../models/activity.model.js';
import { Family } from '../models/family.model.js';
import { Session } from '../models/session.model.js';
import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { ApiError } from '../utils/api-error.js';
import { createAccessToken, createRefreshToken } from './token.service.js';

const DEFAULT_ADMIN_EMAIL = 'sarangblazicon@gmail.com';

export async function registerParent(input: {
  firstName: string;
  lastName?: string;
  familyName: string;
  email?: string;
  password?: string;
  idToken?: string;
}) {
  if (input.idToken) {
    return registerParentWithFirebase(input);
  }

  const normalizedEmail = input.email?.toLowerCase();
  if (!normalizedEmail || !input.password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email and password are required');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already in use');
  }

  const family = await Family.create({
    name: input.familyName,
    inviteCode: nanoid(8).toUpperCase(),
    familyCode: `FAM-${nanoid(6).toUpperCase()}`,
  });

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    familyId: family._id,
    role: ROLES.PARENT,
    email: normalizedEmail,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName ?? '',
  });

  family.parentId = user._id;
  await family.save();

  return buildAuthPayload(user.id, ROLES.PARENT, String(family._id), user);
}

export async function login(input: { identifier: string; password: string; role?: Role }) {
  const identifier = input.identifier.toLowerCase();
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  if (input.role && user.role !== input.role) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Role mismatch');
  }

  if (user.role === ROLES.CHILD) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Child accounts must sign in with their access code');
  }

  if (!user.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password login is not available for this account');
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  return buildAuthPayload(user.id, user.role as Role, user.familyId ? String(user.familyId) : undefined, user);
}

export async function createChild(parentId: string, familyId: string, input: {
  firstName: string;
  lastName?: string;
  avatar?: string;
  standard: number;
  school?: string;
  childLoginCode?: string;
}) {
  const childLoginCode = input.childLoginCode 
    ? input.childLoginCode.toString().toUpperCase() 
    : await generateChildLoginCode();

  // Check if code is already in use
  const existing = await User.findOne({ childLoginCode });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'This access code is already in use by another child');
  }
  const child = await User.create({
    parentId,
    familyId,
    role: ROLES.CHILD,
    firstName: input.firstName,
    lastName: input.lastName ?? '',
    standard: input.standard,
    school: input.school ?? '',
    avatar: input.avatar ?? 'space-ranger',
    childLoginCode,
    weeklySchedule: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    wakeUpSettings: {
      targetTime: '06:30',
      mandatory: true,
    },
  });

  await Activity.create({
    familyId,
    actorId: parentId,
    type: 'child_added',
    message: `Added child account for "${child.firstName}"`,
    metadata: { childId: child.id },
  });

  // Auto-create reward wallet for the child
  await Wallet.create({ childId: child._id });

  return child.toObject();
}

export async function getProfile(userId: string) {
  return User.findById(userId).select('-passwordHash').lean();
}

export async function childCodeLogin(code: string, deviceId?: string, deviceInfo?: { platform?: string; osVersion?: string; appVersion?: string }) {
  const normalizedCode = code.trim().toUpperCase();
  const user = await User.findOne({
    childLoginCode: normalizedCode,
    role: ROLES.CHILD,
    isActive: true,
    loginDisabled: { $ne: true },
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid child access code');
  }

  user.lastLoginDate = new Date();
  await user.save();

  const session = await createSession(user.id, user.familyId ? String(user.familyId) : undefined, deviceId, deviceInfo);

  return buildAuthPayload(user.id, ROLES.CHILD, user.familyId ? String(user.familyId) : undefined, user, session.refreshToken);
}

export async function regenerateChildCode(userId: string, familyId: string) {
  const child = await User.findOne({ _id: userId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  child.childLoginCode = await generateChildLoginCode();
  await child.save();
  return child;
}

export async function googleMobileLogin(idToken: string) {
  return firebaseLogin({ idToken, autoCreate: true });
}

export async function changePassword(userId: string, currentPass: string, newPass: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (!user.passwordHash) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password change is not available for social login accounts');
  }

  const isValid = await bcrypt.compare(currentPass, user.passwordHash);
  if (!isValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid current password');
  }

  user.passwordHash = await bcrypt.hash(newPass, 10);
  await user.save();
}

export async function firebaseLogin(input: {
  idToken: string;
  familyName?: string;
  firstName?: string;
  lastName?: string;
  autoCreate?: boolean;
}) {
  let decoded: any;
  try {
    decoded = await verifyFirebaseIdToken(input.idToken);
  } catch (err: any) {
    console.error('[Auth] Firebase token verification failed:', err.message);
    throw new ApiError(StatusCodes.UNAUTHORIZED, `Firebase authentication failed: ${err.message}`);
  }

  if (!decoded.email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Firebase account email is required');
  }

  const email = decoded.email.toLowerCase();
  const firebaseUid = decoded.uid;
  let user = await User.findOne({
    $or: [{ firebaseUid }, { email }],
  });

  const firebaseLoginRoles: Role[] = [ROLES.ADMIN, ROLES.PARENT];
  if (user && !firebaseLoginRoles.includes(user.role as Role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Firebase login is only available for parent and admin accounts');
  }

  if (!user) {
    if (isAdminEmail(email)) {
      user = await User.create({
        role: ROLES.ADMIN,
        email,
        firebaseUid,
        firstName: decoded.name?.trim() || 'Admin',
        lastName: '',
        avatar: 'admin',
      });

      await setFirebaseCustomClaims(firebaseUid, { role: ROLES.ADMIN });
      return buildAuthPayload(user.id, ROLES.ADMIN, undefined, user);
    }

    if (!input.autoCreate && !input.familyName) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'No parent account found for this Firebase user');
    }

    const displayName = decoded.name?.trim() || [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || 'Parent';
    const [derivedFirstName, ...rest] = displayName.split(' ');
    const family = await Family.create({
      name: input.familyName?.trim() || `${derivedFirstName}'s Family`,
      inviteCode: nanoid(8).toUpperCase(),
      familyCode: `FAM-${nanoid(6).toUpperCase()}`,
    });

    user = await User.create({
      familyId: family._id,
      role: ROLES.PARENT,
      email,
      firebaseUid,
      firstName: input.firstName?.trim() || derivedFirstName,
      lastName: input.lastName?.trim() || rest.join(' '),
    });

    family.parentId = user._id;
    await family.save();
  } else if (!user.firebaseUid) {
    user.firebaseUid = firebaseUid;
    await user.save();
  }

  if (user.role === ROLES.ADMIN) {
    await setFirebaseCustomClaims(firebaseUid, { role: ROLES.ADMIN });
  }

  return buildAuthPayload(user.id, user.role as Role, user.familyId ? String(user.familyId) : undefined, user);
}

async function registerParentWithFirebase(input: {
  firstName: string;
  lastName?: string;
  familyName: string;
  email?: string;
  password?: string;
  idToken?: string;
}) {
  const idToken = input.idToken;
  if (!idToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Firebase idToken is required');
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  if (!decoded.email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Firebase account email is required');
  }

  const email = decoded.email.toLowerCase();
  if (input.email && input.email.toLowerCase() !== email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email does not match the Firebase account');
  }

  const existingUser = await User.findOne({
    $or: [{ firebaseUid: decoded.uid }, { email }],
  });
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already in use');
  }

  const family = await Family.create({
    name: input.familyName,
    inviteCode: nanoid(8).toUpperCase(),
    familyCode: `FAM-${nanoid(6).toUpperCase()}`,
  });

  const user = await User.create({
    familyId: family._id,
    role: ROLES.PARENT,
    email,
    firebaseUid: decoded.uid,
    firstName: input.firstName,
    lastName: input.lastName ?? '',
  });

  family.parentId = user._id;
  await family.save();

  return buildAuthPayload(user.id, ROLES.PARENT, String(family._id), user);
}

async function generateChildLoginCode() {
  let code = '';
  let exists = true;

  while (exists) {
    code = nanoid(6).toUpperCase();
    exists = Boolean(await User.exists({ childLoginCode: code }));
  }

  return code;
}

function buildAuthPayload(userId: string, role: Role, familyId: string | undefined, user: {
  firstName: string;
  lastName?: string;
  email?: string | null;
  firebaseUid?: string | null;
  username?: string | null;
  childLoginCode?: string | null;
  avatar?: string | null;
  standard?: number | null;
  points?: number;
  streak?: number;
  chessWins?: number;
  chessGamesPlayed?: number;
  lastChessRewardAt?: Date | null;
  memoryWins?: number;
  memoryGamesPlayed?: number;
  mathWins?: number;
  mathGamesPlayed?: number;
  patternWins?: number;
  patternGamesPlayed?: number;
  school?: string | null;
  age?: number | null;
  birthday?: Date | null;
  permissions?: Record<string, unknown> | null;
  settings?: Record<string, unknown> | null;
  loginDisabled?: boolean | null;
}, sessionRefreshToken?: string) {
  const accessToken = createAccessToken({
    sub: userId,
    role,
    familyId,
  });

  const refreshToken = sessionRefreshToken || createRefreshToken({
    sub: userId,
    role,
    familyId,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: userId,
      role,
      familyId,
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      email: user.email ?? undefined,
      username: user.username ?? undefined,
      childLoginCode: user.childLoginCode ?? undefined,
      avatar: user.avatar ?? undefined,
      standard: user.standard ?? 1,
      school: user.school ?? undefined,
      points: user.points ?? 0,
      streak: user.streak ?? 0,
      age: user.age ?? undefined,
      birthday: user.birthday ?? undefined,
      permissions: user.permissions ?? undefined,
      settings: user.settings ?? undefined,
      chessWins: user.chessWins ?? 0,
      chessGamesPlayed: user.chessGamesPlayed ?? 0,
      memoryWins: user.memoryWins ?? 0,
      memoryGamesPlayed: user.memoryGamesPlayed ?? 0,
      mathWins: user.mathWins ?? 0,
      mathGamesPlayed: user.mathGamesPlayed ?? 0,
      patternWins: user.patternWins ?? 0,
      patternGamesPlayed: user.patternGamesPlayed ?? 0,
      lastChessRewardAt: user.lastChessRewardAt ?? undefined,
    },
  };
}

// ===== PIN LOGIN =====
export async function setChildPin(childId: string, familyId: string, pin: string) {
  const child = await User.findOne({ _id: childId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const pinHash = await bcrypt.hash(pin, 10);
  child.pin = pinHash;
  child.pinAttempts = 0;
  child.pinLockedUntil = undefined;
  await child.save();

  return { success: true };
}

export async function childPinLogin(pin: string, deviceId?: string, deviceInfo?: { platform?: string; osVersion?: string; appVersion?: string }) {
  const child = await User.findOne({
    pin: { $exists: true, $ne: null },
    role: ROLES.CHILD,
    isActive: true,
    loginDisabled: { $ne: true },
  });

  if (!child || !child.pin) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'PIN login is not available');
  }

  if (child.pinLockedUntil && child.pinLockedUntil > new Date()) {
    throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Account is temporarily locked due to too many failed attempts');
  }

  const isValid = await bcrypt.compare(pin, child.pin);
  if (!isValid) {
    child.pinAttempts = (child.pinAttempts || 0) + 1;
    if (child.pinAttempts >= 5) {
      child.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      child.pinAttempts = 0;
    }
    await child.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid PIN');
  }

  child.pinAttempts = 0;
  child.pinLockedUntil = undefined;
  child.lastLoginDate = new Date();
  await child.save();

  const session = await createSession(child.id, child.familyId ? String(child.familyId) : undefined, deviceId, deviceInfo);

  return buildAuthPayload(child.id, ROLES.CHILD, child.familyId ? String(child.familyId) : undefined, child, session.refreshToken);
}

// ===== SESSION MANAGEMENT =====
export async function createSession(
  userId: string,
  familyId: string | undefined,
  deviceId?: string,
  deviceInfo?: { platform?: string; osVersion?: string; appVersion?: string },
) {
  const refreshToken = createRefreshToken({ sub: userId, role: ROLES.CHILD, familyId });
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await Session.create({
    userId,
    familyId,
    refreshTokenHash,
    deviceId: deviceId || 'unknown',
    platform: (deviceInfo?.platform as 'android' | 'ios' | 'web') || 'android',
    ip: '0.0.0.0',
    userAgent: `${deviceInfo?.platform || 'unknown'}/${deviceInfo?.osVersion || 'unknown'}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    const jwt = await import('jsonwebtoken');
    payload = jwt.default.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; role: Role; familyId?: string };
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const session = await Session.findOne({ refreshTokenHash, isActive: true });

  if (!session) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Session not found or revoked');
  }

  if (session.expiresAt < new Date()) {
    session.isActive = false;
    session.revokedAt = new Date();
    session.revokeReason = 'expired';
    await session.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Session has expired');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found or deactivated');
  }

  const newAccessToken = createAccessToken({
    sub: payload.sub,
    role: payload.role,
    familyId: payload.familyId,
  });

  session.lastActiveAt = new Date();
  await session.save();

  return {
    accessToken: newAccessToken,
    refreshToken,
  };
}

export async function revokeSession(sessionId: string, userId: string) {
  const session = await Session.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
  }

  session.isActive = false;
  session.revokedAt = new Date();
  session.revokeReason = 'manual';
  await session.save();

  return { success: true };
}

export async function revokeAllSessions(userId: string) {
  await Session.updateMany(
    { userId, isActive: true },
    { isActive: false, revokedAt: new Date(), revokeReason: 'logout_all' },
  );
  return { success: true };
}

export async function getActiveSessions(userId: string) {
  return Session.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .select('deviceId platform ip userAgent lastActiveAt createdAt')
    .sort({ lastActiveAt: -1 })
    .lean();
}

// ===== CHILD MANAGEMENT =====
export async function updateChildProfile(
  childId: string,
  familyId: string,
  input: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    age?: number;
    birthday?: Date;
    grade?: number;
    school?: string;
  },
) {
  const child = await User.findOne({ _id: childId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  if (input.firstName) child.firstName = input.firstName;
  if (input.lastName !== undefined) child.lastName = input.lastName;
  if (input.avatar) child.avatar = input.avatar;
  if (input.age !== undefined) child.age = input.age;
  if (input.birthday) child.birthday = input.birthday;
  if (input.grade !== undefined) child.standard = input.grade;
  if (input.school !== undefined) child.school = input.school;

  await child.save();
  return child.toObject();
}

export async function archiveChild(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  child.archivedAt = new Date();
  child.isActive = false;
  child.loginDisabled = true;
  await child.save();

  await Activity.create({
    familyId,
    actorId: familyId,
    type: 'child_updated',
    message: `"${child.firstName}" was archived`,
    metadata: { childId, action: 'archive' },
  });

  return { success: true };
}

export async function deleteChild(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  await User.findByIdAndDelete(childId);

  const { Device } = await import('../models/device.model.js');
  await Device.deleteMany({ childId });

  const { Session } = await import('../models/session.model.js');
  await Session.deleteMany({ userId: childId });

  await Activity.create({
    familyId,
    actorId: familyId,
    type: 'child_updated',
    message: `"${child.firstName}" was removed from the family`,
    metadata: { childId, action: 'delete' },
  });

  return { success: true };
}

export async function disableChildLogin(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  child.loginDisabled = !child.loginDisabled;
  await child.save();

  if (child.loginDisabled) {
    const { Session } = await import('../models/session.model.js');
    await Session.updateMany(
      { userId: childId, isActive: true },
      { isActive: false, revokedAt: new Date(), revokeReason: 'parent_disabled' },
    );
  }

  return { loginDisabled: child.loginDisabled };
}

export async function transferChild(childId: string, fromFamilyId: string, toFamilyId: string) {
  const child = await User.findOne({ _id: childId, familyId: fromFamilyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in this family');
  }

  const toFamily = await Family.findById(toFamilyId);
  if (!toFamily) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Target family not found');
  }

  child.familyId = toFamily._id;
  await child.save();

  await Activity.create({
    familyId: fromFamilyId,
    actorId: fromFamilyId,
    type: 'child_updated',
    message: `"${child.firstName}" was transferred to another family`,
    metadata: { childId, action: 'transfer', toFamilyId },
  });

  return { success: true };
}

export async function resetChildPin(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: ROLES.CHILD });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  child.pin = undefined;
  child.pinAttempts = 0;
  child.pinLockedUntil = undefined;
  await child.save();

  return { success: true };
}

function isAdminEmail(email: string) {
  const configuredAdminEmails = [
    DEFAULT_ADMIN_EMAIL,
    process.env.ADMIN_EMAIL,
    env.NODE_ENV === 'development' ? 'admin@kiddo.local' : undefined,
  ]
    .filter(Boolean)
    .map((value) => value!.trim().toLowerCase());

  return configuredAdminEmails.includes(email.trim().toLowerCase());
}
