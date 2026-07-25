import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';
import { AnalyticsExtService } from '../services/analytics-ext.service.js';

export const getChildSpending = asyncHandler(async (req: Request, res: Response) => {
  const familyId = req.user!.familyId;
  if (!familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');
  const period = (req.query.period as string) as 'weekly' | 'monthly';
  const result = await AnalyticsExtService.getChildSpendingAnalytics(familyId, period || 'weekly');
  res.json(result);
});

export const getChildWalletGrowth = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.params.childId as string;
  const days = Number(req.query.days) || 30;
  const result = await AnalyticsExtService.getWalletGrowthAnalytics(childId, days);
  res.json(result);
});

export const getTopStudents = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const result = await AnalyticsExtService.getTopStudentsByEarnings(req.user!.id, limit);
  res.json(result);
});

export const getClassActivity = asyncHandler(async (req: Request, res: Response) => {
  const result = await AnalyticsExtService.getClassActivityStats(req.user!.id);
  res.json(result);
});

export const getConversionTrends = asyncHandler(async (req: Request, res: Response) => {
  const days = Number(req.query.days) || 30;
  const result = await AnalyticsExtService.getPlatformConversionTrends(days);
  res.json(result);
});

export const getApprovalStats = asyncHandler(async (_req: Request, res: Response) => {
  const result = await AnalyticsExtService.getApprovalWorkflowStats();
  res.json(result);
});
