import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as authService from '../services/auth.service.js';

export const registerParent = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.registerParent(req.body);
  res.status(StatusCodes.CREATED).json(payload);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.login(req.body);
  res.status(StatusCodes.OK).json(payload);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const profile = await authService.getProfile(req.user!.id);
  res.status(StatusCodes.OK).json(profile);
});

export const createChild = asyncHandler(async (req: Request, res: Response) => {
  const child = await authService.createChild(req.user!.id, req.user!.familyId!, req.body);
  res.status(StatusCodes.CREATED).json(child);
});

export const childCodeLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.childCodeLogin(req.body.code);
  res.status(StatusCodes.OK).json(payload);
});

export const childPinLogin = asyncHandler(async (req: Request, res: Response) => {
  const { pin, deviceId, platform, osVersion, appVersion } = req.body;
  const payload = await authService.childPinLogin(pin, deviceId, { platform, osVersion, appVersion });
  res.status(StatusCodes.OK).json(payload);
});

export const setChildPin = asyncHandler(async (req: Request, res: Response) => {
  await authService.setChildPin(req.params.childId as string, req.user!.familyId!, req.body.pin);
  res.status(StatusCodes.OK).json({ success: true });
});

export const resetChildPin = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetChildPin(req.params.childId as string, req.user!.familyId!);
  res.status(StatusCodes.OK).json({ success: true });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.refreshAccessToken(req.body.refreshToken);
  res.status(StatusCodes.OK).json(payload);
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await authService.getActiveSessions(req.user!.id);
  res.status(StatusCodes.OK).json({ sessions });
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  await authService.revokeSession(req.params.sessionId as string, req.user!.id);
  res.status(StatusCodes.OK).json({ success: true });
});

export const revokeAllSessions = asyncHandler(async (req: Request, res: Response) => {
  await authService.revokeAllSessions(req.user!.id);
  res.status(StatusCodes.OK).json({ success: true });
});

export const googleMobileLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.googleMobileLogin(req.body.idToken);
  res.status(StatusCodes.OK).json(payload);
});

export const firebaseLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.firebaseLogin(req.body);
  res.status(StatusCodes.OK).json(payload);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  res.status(StatusCodes.OK).json({ success: true, message: 'Password changed successfully' });
});

export const updateChildProfile = asyncHandler(async (req: Request, res: Response) => {
  const child = await authService.updateChildProfile(req.params.childId as string, req.user!.familyId!, req.body);
  res.status(StatusCodes.OK).json(child);
});

export const archiveChild = asyncHandler(async (req: Request, res: Response) => {
  await authService.archiveChild(req.params.childId as string, req.user!.familyId!);
  res.status(StatusCodes.OK).json({ success: true });
});

export const deleteChild = asyncHandler(async (req: Request, res: Response) => {
  await authService.deleteChild(req.params.childId as string, req.user!.familyId!);
  res.status(StatusCodes.OK).json({ success: true });
});

export const disableChildLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.disableChildLogin(req.params.childId as string, req.user!.familyId!);
  res.status(StatusCodes.OK).json(result);
});

export const transferChild = asyncHandler(async (req: Request, res: Response) => {
  await authService.transferChild(req.params.childId as string, req.user!.familyId!, req.body.toFamilyId);
  res.status(StatusCodes.OK).json({ success: true });
});
