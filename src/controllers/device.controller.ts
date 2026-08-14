import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as deviceService from '../services/device.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const device = await deviceService.registerDevice(
    req.params.childId as string,
    req.user!.familyId!,
    req.body,
  );
  res.status(StatusCodes.CREATED).json(device);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const devices = await deviceService.getDevices(
    req.params.childId as string,
    req.user!.familyId!,
  );
  res.status(StatusCodes.OK).json({ devices });
});

export const rename = asyncHandler(async (req: Request, res: Response) => {
  const device = await deviceService.renameDevice(
    req.params.deviceId as string,
    req.params.childId as string,
    req.user!.familyId!,
    req.body.name,
  );
  res.status(StatusCodes.OK).json(device);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deviceService.removeDevice(
    req.params.deviceId as string,
    req.params.childId as string,
    req.user!.familyId!,
  );
  res.status(StatusCodes.OK).json({ success: true });
});

export const forceLogout = asyncHandler(async (req: Request, res: Response) => {
  await deviceService.forceLogout(
    req.params.deviceId as string,
    req.params.childId as string,
    req.user!.familyId!,
  );
  res.status(StatusCodes.OK).json({ success: true });
});
