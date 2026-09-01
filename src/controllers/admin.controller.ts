import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import { getAdminAnalytics } from '../services/analytics.service.js';
import { User } from '../models/user.model.js';
import { Family } from '../models/family.model.js';
import { Task } from '../models/task.model.js';
import { Reward } from '../models/reward.model.js';
import { RewardRule } from '../models/reward-rule.model.js';
import { AvatarItem } from '../models/avatar-item.model.js';
import { Activity } from '../models/activity.model.js';
import { SchoolClass } from '../models/school-class.model.js';
import { Types } from 'mongoose';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAdminAnalytics();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    parents,
    children,
    teachers,
    activeUsers,
    families,
    schoolClasses,
    completedToday,
    rewards,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ role: 'parent' }),
    User.countDocuments({ role: 'child' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ isActive: true }),
    Family.countDocuments(),
    SchoolClass.countDocuments({ status: 'active' }),
    Task.countDocuments({ status: 'completed', completedAt: { $gte: todayStart } }),
    Reward.countDocuments(),
    Activity.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  res.status(StatusCodes.OK).json({
    summary: analytics.summary,
    latestMetrics: analytics.latestMetrics,
    totals: {
      parents,
      children,
      teachers,
      families,
      activeUsers,
      schoolClasses,
      tasks: analytics.summary.totalTasks,
      completedToday,
      rewards,
    },
    recentActivity: recentActivity.map((entry) => ({
      _id: String(entry._id),
      type: entry.type,
      message: entry.message,
      createdAt: entry.createdAt,
    })),
  });
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

export const listAvatarItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await AvatarItem.find().sort({ createdAt: -1 }).lean();
  res.status(StatusCodes.OK).json(items);
});

export const createAvatarItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await AvatarItem.create(req.body);
  res.status(StatusCodes.CREATED).json(item);
});

export const updateAvatarItem = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const item = await AvatarItem.findByIdAndUpdate(id, req.body, { new: true });
  if (!item) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Avatar item not found' });
  }
  res.status(StatusCodes.OK).json(item);
});

export const deleteAvatarItem = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const item = await AvatarItem.findByIdAndDelete(id);
  if (!item) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Avatar item not found' });
  }
  res.status(StatusCodes.OK).json({ success: true, message: 'Avatar item deleted' });
});

