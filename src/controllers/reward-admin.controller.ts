import { Request, Response } from 'express';
import { RewardAdminService } from '../services/reward-admin.service.js';
import { RewardService } from '../services/reward.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const listRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await RewardAdminService.listRules();
  res.json(rules);
});

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await RewardAdminService.createRule({ ...req.body, adminId: req.user!.id });
  res.status(201).json(rule);
});

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const rule = await RewardAdminService.updateRule(id, { ...req.body, adminId: req.user!.id });
  res.json(rule);
});

export const listCampaigns = asyncHandler(async (_req: Request, res: Response) => {
  const campaigns = await RewardAdminService.listCampaigns();
  res.json(campaigns);
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await RewardAdminService.createCampaign({ ...req.body, adminId: req.user!.id });
  res.status(201).json(campaign);
});

export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const campaign = await RewardAdminService.updateCampaign(id, req.body);
  res.json(campaign);
});

export const getTransactionLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page as string;
  const limit = req.query.limit as string;
  const actionType = req.query.actionType as string | undefined;
  const userId = req.query.userId as string | undefined;
  const logs = await RewardAdminService.getTransactionLogs(
    Number(page) || 1,
    Number(limit) || 50,
    actionType,
    userId,
  );
  res.json(logs);
});

export const getEconomyStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await RewardAdminService.getEconomyStats();
  res.json(stats);
});

export const getConversionAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await RewardAdminService.getConversionAnalytics();
  res.json(analytics);
});

export const adjustBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const { pointsDelta, coinsDelta, reason } = req.body;
  const result = await RewardService.adjustBalance(userId, req.user!.id, pointsDelta || 0, coinsDelta || 0, reason || 'Admin adjustment');
  res.json(result);
});

export const freezeWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const result = await RewardService.setWalletStatus(userId, 'frozen');
  res.json(result);
});

export const unfreezeWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const result = await RewardService.setWalletStatus(userId, 'active');
  res.json(result);
});
