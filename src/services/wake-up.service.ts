import { StatusCodes } from 'http-status-codes';
import { User } from '../models/user.model.js';
import { WakeUpCompletion } from '../models/wake-up-completion.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';
import { Activity } from '../models/activity.model.js';

type RewardBracket = 'before_430' | 'before_530' | 'before_630' | 'after_630';

const BRACKET_MAP: Array<{ maxHour: number; maxMin: number; points: number; bracket: RewardBracket }> = [
  { maxHour: 4, maxMin: 30, points: 30, bracket: 'before_430' },
  { maxHour: 5, maxMin: 30, points: 20, bracket: 'before_530' },
  { maxHour: 6, maxMin: 30, points: 10, bracket: 'before_630' },
];

function calculateReward(hours: number, minutes: number): { points: number; bracket: RewardBracket } {
  for (const bracket of BRACKET_MAP) {
    if (hours < bracket.maxHour || (hours === bracket.maxHour && minutes <= bracket.maxMin)) {
      return { points: bracket.points, bracket: bracket.bracket };
    }
  }
  return { points: 0, bracket: 'after_630' };
}

export async function completeWakeUp(
  childId: string,
  familyId: string,
  completedAt: Date = new Date(),
) {
  const child = await User.findById(childId);
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const todayStart = new Date(completedAt);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(completedAt);
  todayEnd.setHours(23, 59, 59, 999);

  const existing = await WakeUpCompletion.findOne({
    childId,
    date: { $gte: todayStart, $lte: todayEnd },
  });

  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Wake Up already completed today');
  }

  const hours = completedAt.getHours();
  const minutes = completedAt.getMinutes();
  const { points, bracket } = calculateReward(hours, minutes);

  const targetTime = child.wakeUpSettings?.targetTime || '06:30';

  const completion = await WakeUpCompletion.create({
    childId,
    familyId,
    date: completedAt,
    completedAt,
    rewardPoints: points,
    rewardBracket: bracket,
    targetTime,
  });

  if (points > 0) {
    child.points = (child.points || 0) + points;
    await child.save();

    const wallet = await Wallet.findOne({ childId });
    if (wallet) {
      await RewardTransaction.create({
        userId: childId,
        walletId: wallet._id,
        actionType: 'habit_tracking',
        rewardPoints: points,
        redeemCoins: 0,
        balanceBefore: { rewardPoints: child.points - points, redeemCoins: wallet.redeemCoins },
        balanceAfter: { rewardPoints: child.points, redeemCoins: wallet.redeemCoins },
        description: `Wake Up reward: ${bracket.replace('_', ' ')}`,
        referenceId: completion._id,
        referenceType: 'WakeUpCompletion',
        createdBy: childId,
        source: 'system',
        metadata: { rewardBracket: bracket, completedAt: completedAt.toISOString() },
      });
    }
  }

  await Activity.create({
    familyId,
    actorId: childId,
    type: 'task_completed',
    message: `${child.firstName} woke up and earned ${points} points!`,
    metadata: { childId, rewardPoints: points, rewardBracket: bracket, completedAt },
  });

  if (points >= 30) {
    NotificationService.sendToFamilyParents(
      familyId,
      'Early Bird! 🌅',
      `${child.firstName} woke up bright and early! Earned ${points} points!`,
    ).catch(() => {});
  } else if (points > 0) {
    NotificationService.sendToFamilyParents(
      familyId,
      'Good Morning! ☀️',
      `${child.firstName} woke up! Earned ${points} points.`,
    ).catch(() => {});
  } else {
    NotificationService.sendToFamilyParents(
      familyId,
      'Late Wake Up ⏰',
      `${child.firstName} woke up after 6:30 AM and earned 0 points.`,
    ).catch(() => {});
  }

  return {
    rewardPoints: points,
    rewardBracket: bracket,
    completedAt,
    targetTime,
  };
}

export async function getWakeUpHistory(
  childId: string,
  familyId: string,
  limit = 30,
) {
  const completions = await WakeUpCompletion.find({ childId, familyId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return completions;
}

export async function getTodayWakeUpStatus(childId: string, familyId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const completion = await WakeUpCompletion.findOne({
    childId,
    familyId,
    date: { $gte: todayStart, $lte: todayEnd },
  }).lean();

  return {
    completed: !!completion,
    completion: completion || null,
  };
}
