import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ManagementService } from '../services/management.service.js';
import { NotificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';

// ---------------------------------------------------------------------------
// Parent: children wallets
// ---------------------------------------------------------------------------

export const getChildrenWallets = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const result = await ManagementService.getChildrenWallets(familyId);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Teacher: student wallets
// ---------------------------------------------------------------------------

export const getTeacherStudentWallets = asyncHandler(async (req: Request, res: Response) => {
  const result = await ManagementService.getTeacherStudentWallets(req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Admin: platform economy overview
// ---------------------------------------------------------------------------

export const getPlatformEconomyOverview = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ManagementService.getPlatformEconomyOverview();
  res.json(result);
});

// ---------------------------------------------------------------------------
// Approval workflow
// ---------------------------------------------------------------------------

export const getFamilyPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const result = await ManagementService.getFamilyPendingApprovals(familyId);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export const updateNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== 'object') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'preferences object required');
  }
  const result = await ManagementService.updateNotificationPreferences(req.user!.id, preferences);
  res.json(result);
});

export const getNotificationPreferences = asyncHandler(async (req: Request, res: Response) => {
  const result = await ManagementService.getNotificationPreferences(req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: send notification to family
// ---------------------------------------------------------------------------

export const sendFamilyNotification = asyncHandler(async (req: Request, res: Response) => {
  const { childId, title, body } = req.body;
  if (!childId || !title || !body) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'childId, title, and body required');
  }
  await NotificationService.sendToUser(childId, title, body);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Wallet spending limit
// ---------------------------------------------------------------------------

export const setWalletSpendingLimit = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.params.childId as string;
  const { maxDailySpend } = req.body;
  const result = await ManagementService.setWalletSpendingLimit(childId, req.user!.id, maxDailySpend);
  res.json(result);
});
