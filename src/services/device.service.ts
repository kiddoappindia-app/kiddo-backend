import { StatusCodes } from 'http-status-codes';
import { Device } from '../models/device.model.js';
import { User } from '../models/user.model.js';
import { Family } from '../models/family.model.js';
import { ApiError } from '../utils/api-error.js';

export async function registerDevice(
  childId: string,
  familyId: string,
  input: {
    deviceId: string;
    name?: string;
    platform: 'android' | 'ios' | 'web';
    osVersion?: string;
    appVersion?: string;
    pushToken?: string;
  },
) {
  const family = await Family.findById(familyId);
  if (!family) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Family not found');
  }

  const child = await User.findById(childId);
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  if (!child.familyId || String(child.familyId) !== familyId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Child does not belong to this family');
  }

  const existingDevice = await Device.findOne({ deviceId: input.deviceId });
  if (existingDevice) {
    existingDevice.lastActiveAt = new Date();
    existingDevice.isOnline = true;
    if (input.pushToken) existingDevice.pushToken = input.pushToken;
    if (input.osVersion) existingDevice.osVersion = input.osVersion;
    if (input.appVersion) existingDevice.appVersion = input.appVersion;
    await existingDevice.save();
    return existingDevice.toObject();
  }

  const activeDevices = await Device.countDocuments({ childId, isActive: true });
  if (activeDevices >= 3) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maximum 3 active devices per child');
  }

  const device = await Device.create({
    childId,
    familyId,
    deviceId: input.deviceId,
    name: input.name || `${input.platform} device`,
    platform: input.platform,
    osVersion: input.osVersion || '',
    appVersion: input.appVersion || '',
    pushToken: input.pushToken,
    isOnline: true,
    lastActiveAt: new Date(),
    isPrimary: activeDevices === 0,
  });

  if (!child.devices) child.devices = [];
  child.devices.push(device._id);
  await child.save();

  return device.toObject();
}

export async function getDevices(childId: string, familyId: string) {
  const child = await User.findById(childId);
  if (!child || String(child.familyId) !== familyId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied');
  }

  return Device.find({ childId, isActive: true }).sort({ lastActiveAt: -1 }).lean();
}

export async function renameDevice(
  deviceId: string,
  childId: string,
  familyId: string,
  name: string,
) {
  const device = await Device.findOne({ _id: deviceId, childId, familyId, isActive: true });
  if (!device) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Device not found');
  }

  device.name = name;
  await device.save();
  return device.toObject();
}

export async function removeDevice(
  deviceId: string,
  childId: string,
  familyId: string,
) {
  const device = await Device.findOne({ _id: deviceId, childId, familyId, isActive: true });
  if (!device) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Device not found');
  }

  device.isActive = false;
  device.isOnline = false;
  await device.save();

  await User.findByIdAndUpdate(childId, { $pull: { devices: device._id } });

  return { success: true };
}

export async function forceLogout(
  deviceId: string,
  childId: string,
  familyId: string,
) {
  const device = await Device.findOne({ _id: deviceId, childId, familyId, isActive: true });
  if (!device) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Device not found');
  }

  device.isOnline = false;
  device.lastActiveAt = new Date();
  await device.save();

  const { Session } = await import('../models/session.model.js');
  await Session.updateMany(
    { userId: childId, deviceId: device.deviceId, isActive: true },
    { isActive: false, revokedAt: new Date(), revokeReason: 'force_logout' },
  );

  return { success: true };
}

export async function updateDeviceOnlineStatus(deviceId: string, isOnline: boolean) {
  await Device.findOneAndUpdate(
    { deviceId },
    {
      isOnline,
      lastActiveAt: new Date(),
      ...(isOnline ? {} : { lastSyncAt: new Date() }),
    },
  );
}

export async function syncDevice(deviceId: string) {
  await Device.findOneAndUpdate(
    { deviceId },
    { lastSyncAt: new Date(), lastActiveAt: new Date() },
  );
}
