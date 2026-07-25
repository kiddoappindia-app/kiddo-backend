import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { getAdminAnalytics } from '../services/analytics.service.js';
import { Task } from '../models/task.model.js';
import { Reward } from '../models/reward.model.js';
import { RewardRule } from '../models/reward-rule.model.js';
import { Types } from 'mongoose';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAdminAnalytics();
  res.status(StatusCodes.OK).json(analytics);
});

export const moderateTasks = asyncHandler(async (_req: Request, res: Response) => {
  const tasks = await Task.find().sort({ createdAt: -1 }).limit(50).lean();
  res.status(StatusCodes.OK).json(tasks);
});

export const moderateRewards = asyncHandler(async (_req: Request, res: Response) => {
  const rewards = await Reward.find().sort({ createdAt: -1 }).limit(50).lean();
  res.status(StatusCodes.OK).json(rewards);
});

export const updateRewardRule = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const rule = await RewardRule.findById(id);
  if (!rule) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Reward rule not found' });
  }
  Object.assign(rule, { ...req.body, updatedBy: new Types.ObjectId(req.user!.id) });
  await rule.save();
  res.json(rule);
});
