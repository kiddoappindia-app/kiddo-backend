import { StatusCodes } from 'http-status-codes';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

export interface ChildPermissions {
  dailyScreenTimeMinutes?: number;
  gamesEnabled?: boolean;
  storeEnabled?: boolean;
  walletEnabled?: boolean;
  teacherIntegration?: boolean;
  homeworkMode?: boolean;
  weekendMode?: boolean;
  studyMode?: boolean;
}

interface PermissionsDoc {
  dailyScreenTimeMinutes: number;
  gamesEnabled: boolean;
  storeEnabled: boolean;
  walletEnabled: boolean;
  teacherIntegration: boolean;
  homeworkMode: boolean;
  weekendMode: boolean;
  studyMode: boolean;
}

const DEFAULT_PERMISSIONS: PermissionsDoc = {
  dailyScreenTimeMinutes: 120,
  gamesEnabled: true,
  storeEnabled: true,
  walletEnabled: true,
  teacherIntegration: false,
  homeworkMode: false,
  weekendMode: false,
  studyMode: false,
};

export async function getChildPermissions(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' })
    .select('permissions firstName')
    .lean();

  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  return {
    childId,
    firstName: child.firstName,
    permissions: (child.permissions as PermissionsDoc) || DEFAULT_PERMISSIONS,
  };
}

export async function updateChildPermissions(
  childId: string,
  familyId: string,
  permissions: ChildPermissions,
) {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const currentPermissions = (child.permissions as PermissionsDoc) || { ...DEFAULT_PERMISSIONS };

  if (permissions.dailyScreenTimeMinutes !== undefined) {
    currentPermissions.dailyScreenTimeMinutes = permissions.dailyScreenTimeMinutes;
  }
  if (permissions.gamesEnabled !== undefined) {
    currentPermissions.gamesEnabled = permissions.gamesEnabled;
  }
  if (permissions.storeEnabled !== undefined) {
    currentPermissions.storeEnabled = permissions.storeEnabled;
  }
  if (permissions.walletEnabled !== undefined) {
    currentPermissions.walletEnabled = permissions.walletEnabled;
  }
  if (permissions.teacherIntegration !== undefined) {
    currentPermissions.teacherIntegration = permissions.teacherIntegration;
  }
  if (permissions.homeworkMode !== undefined) {
    currentPermissions.homeworkMode = permissions.homeworkMode;
  }
  if (permissions.weekendMode !== undefined) {
    currentPermissions.weekendMode = permissions.weekendMode;
  }
  if (permissions.studyMode !== undefined) {
    currentPermissions.studyMode = permissions.studyMode;
  }

  child.set('permissions', currentPermissions);
  await child.save();

  return {
    childId,
    permissions: currentPermissions,
  };
}

export async function getAllChildrenPermissions(familyId: string) {
  const children = await User.find({ familyId, role: 'child', isActive: true })
    .select('firstName lastName avatar permissions')
    .lean();

  return children.map((child) => ({
    childId: String(child._id),
    firstName: child.firstName,
    lastName: child.lastName,
    avatar: child.avatar,
    permissions: (child.permissions as PermissionsDoc) || DEFAULT_PERMISSIONS,
  }));
}
