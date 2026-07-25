import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { RewardService } from '../services/reward.service.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const listRewards = asyncHandler(async (req: Request, res: Response) => {
  const rewards = await RewardService.listRewards(req.user!.familyId!, req.user!.id, req.user!.role);
  res.status(StatusCodes.OK).json(rewards);
});

export const createReward = asyncHandler(async (req: Request, res: Response) => {
  const reward = await RewardService.createReward(req.user!.familyId!, req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(reward);
});

export const redeemReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await RewardService.redeemReward(getParam(req.params.rewardId), req.user!.id, req.user!.familyId!);
  res.status(StatusCodes.OK).json(result);
});

export const updateReward = asyncHandler(async (req: Request, res: Response) => {
  const reward = await RewardService.updateReward(
    getParam(req.params.rewardId),
    req.user!.familyId!,
    req.user!.id,
    req.body,
  );
  res.status(StatusCodes.OK).json(reward);
});

export const deleteReward = asyncHandler(async (req: Request, res: Response) => {
  await RewardService.deleteReward(getParam(req.params.rewardId), req.user!.familyId!, req.user!.id);
  res.status(StatusCodes.OK).json({ success: true });
});
