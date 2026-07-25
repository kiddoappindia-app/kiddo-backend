import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { nanoid } from 'nanoid';
import { ROLES, type Role } from '../constants/roles.js';
import { env } from '../config/env.js';
import { firebaseAuth } from '../config/firebase-admin.js';
import { Activity } from '../models/activity.model.js';
import { Family } from '../models/family.model.js';
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

export async function childCodeLogin(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const user = await User.findOne({
    childLoginCode: normalizedCode,
    role: ROLES.CHILD,
    isActive: true,
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid child access code');
  }

  return buildAuthPayload(user.id, ROLES.CHILD, user.familyId ? String(user.familyId) : undefined, user);
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
  const decoded = await firebaseAuth.verifyIdToken(input.idToken);
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

      await firebaseAuth.setCustomUserClaims(firebaseUid, { role: ROLES.ADMIN });
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
    });

    user = await User.create({
      familyId: family._id,
      role: ROLES.PARENT,
      email,
      firebaseUid,
      firstName: input.firstName?.trim() || derivedFirstName,
      lastName: input.lastName?.trim() || rest.join(' '),
    });
  } else if (!user.firebaseUid) {
    user.firebaseUid = firebaseUid;
    await user.save();
  }

  if (user.role === ROLES.ADMIN) {
    await firebaseAuth.setCustomUserClaims(firebaseUid, { role: ROLES.ADMIN });
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

  const decoded = await firebaseAuth.verifyIdToken(idToken);
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
  });

  const user = await User.create({
    familyId: family._id,
    role: ROLES.PARENT,
    email,
    firebaseUid: decoded.uid,
    firstName: input.firstName,
    lastName: input.lastName ?? '',
  });

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
}) {
  const accessToken = createAccessToken({
    sub: userId,
    role,
    familyId,
  });

  const refreshToken = createRefreshToken({
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
