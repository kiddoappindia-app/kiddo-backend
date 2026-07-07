import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ManagementService } from '../services/management.service.js';
import { NotificationService } from '../services/notification.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

// ===========================================================================
// Parent endpoints
// ===========================================================================

// ---------------------------------------------------------------------------
// Parent: children wallets overview
// ---------------------------------------------------------------------------

export const getChildrenWallets = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const result = await ManagementService.getChildrenWallets(familyId);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: child wallet detail
// ---------------------------------------------------------------------------

export const getChildWalletDetail = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getChildWalletDetail(childId, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: child reward history
// ---------------------------------------------------------------------------

export const getChildRewardHistory = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getChildRewardHistory(childId, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: child coin history
// ---------------------------------------------------------------------------

export const getChildCoinHistory = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getChildCoinHistory(childId, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: approve conversion
// ---------------------------------------------------------------------------

export const approveConversion = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await ManagementService.approveConversion(id, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: reject conversion
// ---------------------------------------------------------------------------

export const rejectConversion = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const { reason } = req.body;
  const result = await ManagementService.rejectConversion(id, req.user!.id, reason);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: approve purchase
// ---------------------------------------------------------------------------

export const approvePurchase = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await ManagementService.approvePurchase(id, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: reject purchase
// ---------------------------------------------------------------------------

export const rejectPurchase = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const { reason } = req.body;
  const result = await ManagementService.rejectPurchase(id, req.user!.id, reason);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: gift reward points
// ---------------------------------------------------------------------------

export const giftRewardPoints = asyncHandler(async (req: Request, res: Response) => {
  const { childId, amount, message } = req.body;
  if (!childId || !amount) throw new ApiError(StatusCodes.BAD_REQUEST, 'childId and amount required');
  const result = await ManagementService.giftRewardPoints(childId, req.user!.id, amount, message);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: gift redeem coins
// ---------------------------------------------------------------------------

export const giftRedeemCoins = asyncHandler(async (req: Request, res: Response) => {
  const { childId, amount, message } = req.body;
  if (!childId || !amount) throw new ApiError(StatusCodes.BAD_REQUEST, 'childId and amount required');
  const result = await ManagementService.giftRedeemCoins(childId, req.user!.id, amount, message);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: custom rewards CRUD
// ---------------------------------------------------------------------------

export const getCustomRewards = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const result = await ManagementService.getCustomRewards(familyId, isActive);
  res.json(result);
});

export const createCustomReward = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const { title, description, pointsCost, unlockedAtStreak } = req.body;
  if (!title || pointsCost === undefined) throw new ApiError(StatusCodes.BAD_REQUEST, 'title and pointsCost required');
  const result = await ManagementService.createCustomReward(familyId, req.user!.id, {
    title, description, pointsCost, unlockedAtStreak,
  });
  res.status(StatusCodes.CREATED).json(result);
});

export const updateCustomReward = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const rewardId = getParam(req.params.rewardId);
  const result = await ManagementService.updateCustomReward(rewardId, familyId, req.user!.id, req.body);
  res.json(result);
});

export const deleteCustomReward = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const rewardId = getParam(req.params.rewardId);
  const result = await ManagementService.deleteCustomReward(rewardId, familyId, req.user!.id);
  res.json(result);
});

export const disableCustomReward = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const rewardId = getParam(req.params.rewardId);
  const result = await ManagementService.updateCustomReward(rewardId, familyId, req.user!.id, { isActive: false });
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: freeze / unfreeze wallet
// ---------------------------------------------------------------------------

export const freezeWallet = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.freezeWallet(childId, req.user!.id);
  res.json(result);
});

export const unfreezeWallet = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.unfreezeWallet(childId, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: configure wallet limits
// ---------------------------------------------------------------------------

export const setWalletSpendingLimit = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const { maxDailySpend } = req.body;
  const result = await ManagementService.setWalletSpendingLimit(childId, req.user!.id, maxDailySpend);
  res.json(result);
});

export const configureWalletPolicy = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.configureWalletPolicy(childId, req.user!.id, req.body);
  res.json(result);
});

export const getWalletPolicy = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getWalletPolicy(childId, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Parent: analytics
// ---------------------------------------------------------------------------

export const getWeeklyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getWeeklyRewardAnalytics(childId, req.user!.id);
  res.json(result);
});

export const getMonthlyAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getMonthlyRewardAnalytics(childId, req.user!.id);
  res.json(result);
});

export const getSpendingAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getSpendingAnalytics(childId, req.user!.id);
  res.json(result);
});

export const getWalletGrowth = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getWalletGrowthAnalytics(childId, req.user!.id);
  res.json(result);
});

export const getGiftHistory = asyncHandler(async (req: Request, res: Response) => {
  const childId = getParam(req.params.childId);
  const result = await ManagementService.getGiftHistory(childId, req.user!.id);
  res.json(result);
});

// ===========================================================================
// Teacher endpoints
// ===========================================================================

// ---------------------------------------------------------------------------
// Teacher: student wallets
// ---------------------------------------------------------------------------

export const getTeacherStudentWallets = asyncHandler(async (req: Request, res: Response) => {
  const result = await ManagementService.getTeacherStudentWallets(req.user!.id);
  res.json(result);
});

export const getStudentRewardHistory = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getParam(req.params.studentId);
  const result = await ManagementService.getStudentRewardHistory(studentId, req.user!.id);
  res.json(result);
});

export const getStudentWallet = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getParam(req.params.studentId);
  const result = await ManagementService.getStudentWallet(studentId, req.user!.id);
  res.json(result);
});

export const getClassLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const result = await ManagementService.getClassLeaderboard(req.user!.id);
  res.json(result);
});

// ===========================================================================
// Admin endpoints
// ===========================================================================

// ---------------------------------------------------------------------------
// Admin: platform economy overview
// ---------------------------------------------------------------------------

export const getPlatformEconomyOverview = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ManagementService.getPlatformEconomyOverview();
  res.json(result);
});

export const getPlatformRewardAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ManagementService.getPlatformRewardAnalytics();
  res.json(result);
});

// ---------------------------------------------------------------------------
// Admin: reward rules
// ---------------------------------------------------------------------------

export const listRewardRules = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ManagementService.listRewardRules();
  res.json(result);
});

export const getRewardRule = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await ManagementService.getRewardRule(id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Admin: settings
// ---------------------------------------------------------------------------

export const listSettings = asyncHandler(async (_req: Request, res: Response) => {
  const result = await ManagementService.listSettings();
  res.json(result);
});

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
  const key = getParam(req.params.key);
  const value = await ManagementService.getSetting(key);
  res.json({ key, value });
});

export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
  const key = getParam(req.params.key);
  const { value } = req.body;
  if (value === undefined) throw new ApiError(StatusCodes.BAD_REQUEST, 'value required');
  const result = await ManagementService.updateSetting(key, value, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Admin: notifications
// ---------------------------------------------------------------------------

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, body, data } = req.body;
  if (!userId || !title || !body) throw new ApiError(StatusCodes.BAD_REQUEST, 'userId, title, body required');
  const result = await ManagementService.sendNotification(userId, title, body, data);
  res.json(result);
});

export const sendBulkNotification = asyncHandler(async (req: Request, res: Response) => {
  const { userIds, title, body, data } = req.body;
  if (!userIds || !title || !body) throw new ApiError(StatusCodes.BAD_REQUEST, 'userIds, title, body required');
  const result = await ManagementService.sendBulkNotification(userIds, title, body, data);
  res.json(result);
});

// ===========================================================================
// Shared / Cross-role endpoints
// ===========================================================================

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
