import { Request, Response } from 'express';
import { RewardService } from '../services/reward.service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const getMyWallet = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await RewardService.getWallet(req.user!.id);
  res.json(wallet);
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page as string;
  const limit = req.query.limit as string;
  const actionType = req.query.actionType as string | undefined;
  const result = await RewardService.getHistory(
    req.user!.id,
    Number(page) || 1,
    Number(limit) || 20,
    actionType,
  );
  res.json(result);
});

export const awardPoints = asyncHandler(async (req: Request, res: Response) => {
  const { action, points, source, sourceId, description } = req.body;
  const result = await RewardService.awardPoints(
    req.user!.id,
    action,
    points,
    source ?? 'system',
    sourceId,
    description ?? `${points} RP earned`,
  );
  res.json(result);
});

export const convertPoints = asyncHandler(async (req: Request, res: Response) => {
  const { pointsToConvert } = req.body;
  const result = await RewardService.convertPoints(req.user!.id, pointsToConvert);
  res.json(result);
});

export const requestConversion = asyncHandler(async (req: Request, res: Response) => {
  const { pointsToConvert, parentId } = req.body;
  const result = await RewardService.requestConversion(req.user!.id, pointsToConvert, parentId);
  res.json(result);
});

export const approveConversion = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardService.approveConversion(id, req.user!.id);
  res.json(result);
});

export const rejectConversion = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const result = await RewardService.rejectConversion(id, req.user!.id, reason);
  res.json(result);
});

export const getConversions = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const conversions = await RewardService.getConversions(req.user!.id, status);
  res.json(conversions);
});

export const getPendingConversions = asyncHandler(async (req: Request, res: Response) => {
  const conversions = await RewardService.getPendingConversionsForFamily(req.user!.familyId!);
  res.json(conversions);
});

export const giftPoints = asyncHandler(async (req: Request, res: Response) => {
  const { receiverId, amount, message } = req.body;
  const result = await RewardService.giftPoints(req.user!.id, receiverId, amount, message);
  res.json(result);
});

export const giftCoins = asyncHandler(async (req: Request, res: Response) => {
  const { childId, amount, message } = req.body;
  const result = await RewardService.giftCoins(req.user!.id, childId, amount, message);
  res.json(result);
});

export const getChildWallet = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.params.childId as string;
  const wallet = await RewardService.getWallet(childId);
  res.json(wallet);
});

export const spendCoins = asyncHandler(async (req: Request, res: Response) => {
  const { coins, referenceType, referenceId, description } = req.body;
  const result = await RewardService.spendCoins(
    req.user!.id,
    coins,
    referenceType,
    referenceId,
    description ?? `Spent ${coins} RC`,
  );
  res.json(result);
});
