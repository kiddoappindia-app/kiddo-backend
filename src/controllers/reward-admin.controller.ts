import { Request, Response } from 'express';
import { RewardAdminService } from '../services/reward-admin.service.js';
import { RewardService } from '../services/reward.service.js';
import { asyncHandler } from '../utils/async-handler.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

// ---------------------------------------------------------------------------
// Reward rules
// ---------------------------------------------------------------------------

export const listRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await RewardAdminService.listRules();
  res.json(rules);
});

export const getRule = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const rule = await RewardAdminService.getRule(id);
  res.json(rule);
});

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await RewardAdminService.createRule({ ...req.body, adminId: req.user!.id });
  res.status(201).json(rule);
});

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const rule = await RewardAdminService.updateRule(id, { ...req.body, adminId: req.user!.id });
  res.json(rule);
});

export const deleteRule = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.deleteRule(id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export const listCampaigns = asyncHandler(async (_req: Request, res: Response) => {
  const campaigns = await RewardAdminService.listCampaigns();
  res.json(campaigns);
});

export const getCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const campaign = await RewardAdminService.getCampaign(id);
  res.json(campaign);
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await RewardAdminService.createCampaign({ ...req.body, adminId: req.user!.id });
  res.status(201).json(campaign);
});

export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const campaign = await RewardAdminService.updateCampaign(id, req.body);
  res.json(campaign);
});

export const deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.deleteCampaign(id);
  res.json(result);
});

export const enableCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.enableCampaign(id);
  res.json(result);
});

export const disableCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.disableCampaign(id);
  res.json(result);
});

export const archiveCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.archiveCampaign(id);
  res.json(result);
});

export const duplicateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.duplicateCampaign(id, req.user!.id);
  res.json(result);
});

export const restoreCampaign = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await RewardAdminService.restoreCampaign(id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Transaction logs
// ---------------------------------------------------------------------------

export const getTransactionLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = getParam(req.query.page as string);
  const limit = getParam(req.query.limit as string);
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

export const getTransactionDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const transaction = await RewardAdminService.getTransactionDetail(id);
  res.json(transaction);
});

export const getEconomyStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await RewardAdminService.getEconomyStats();
  res.json(stats);
});

export const getConversionAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await RewardAdminService.getConversionAnalytics();
  res.json(analytics);
});

// ---------------------------------------------------------------------------
// Wallet management
// ---------------------------------------------------------------------------

export const adjustBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = getParam(req.params.userId);
  const { pointsDelta, coinsDelta, reason } = req.body;
  const result = await RewardService.adjustBalance(userId, req.user!.id, pointsDelta || 0, coinsDelta || 0, reason || 'Admin adjustment');
  res.json(result);
});

export const freezeWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = getParam(req.params.userId);
  const result = await RewardService.setWalletStatus(userId, 'frozen');
  res.json(result);
});

export const unfreezeWallet = asyncHandler(async (req: Request, res: Response) => {
  const userId = getParam(req.params.userId);
  const result = await RewardService.setWalletStatus(userId, 'active');
  res.json(result);
});

export const refundCoins = asyncHandler(async (req: Request, res: Response) => {
  const userId = getParam(req.params.userId);
  const { coins, reason } = req.body;
  if (!coins || coins <= 0) throw new Error('Coins must be positive');
  const result = await RewardService.refundCoins(userId, coins, undefined, undefined, reason || 'Admin refund', req.user!.id);
  res.json(result);
});
