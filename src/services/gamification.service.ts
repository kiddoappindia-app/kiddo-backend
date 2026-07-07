import mongoose, { Types } from 'mongoose';
import { User } from '../models/user.model.js';
import { AchievementDefinition } from '../models/achievement-definition.model.js';
import { BadgeDefinition } from '../models/badge-definition.model.js';
import { Challenge } from '../models/challenge.model.js';
import { GamificationEvent } from '../models/gamification-event.model.js';
import { LoginRewardLog } from '../models/login-reward.model.js';
import { MissionDefinition } from '../models/mission-definition.model.js';
import { MilestoneDefinition } from '../models/milestone-definition.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Activity } from '../models/activity.model.js';
import { RewardService } from './reward.service.js';
import { NotificationService } from './notification.service.js';
import { DEFAULT_XP_NEEDED_MULTIPLIER } from '../constants/reward-economy.js';
import { ROLES } from '../constants/roles.js';

const LEVEL_TITLES = [
  { level: 1, title: 'Rookie' },
  { level: 5, title: 'Scout' },
  { level: 10, title: 'Explorer' },
  { level: 15, title: 'Commander' },
  { level: 20, title: 'Legend' },
  { level: 25, title: 'Mythic' },
  { level: 30, title: 'Titan' },
  { level: 40, title: 'Immortal' },
  { level: 50, title: 'Transcendent' },
];

export class GamificationService {
  // ===========================================================================
  // XP & LEVEL
  // ===========================================================================

  static calcLevelTitle(level: number): string {
    let title = LEVEL_TITLES[0].title;
    for (const t of LEVEL_TITLES) {
      if (level >= t.level) title = t.title;
    }
    return title;
  }

  static calcNextLevelXP(level: number): number {
    return level * level * DEFAULT_XP_NEEDED_MULTIPLIER;
  }

  static async addXP(
    userId: string,
    amount: number,
    source: string = 'system',
    sourceId?: string,
  ): Promise<{
    xpAwarded: number;
    totalXP: number;
    level: number;
    levelUp: boolean;
    newTitle: string;
    nextLevelXP: number;
  }> {
    if (amount <= 0) throw new Error('XP amount must be positive');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.xp = (user.xp ?? 0) + amount;

    let leveledUp = false;
    let xpNeeded = this.calcNextLevelXP(user.level);
    while ((user.xp ?? 0) >= xpNeeded) {
      user.level += 1;
      leveledUp = true;
      xpNeeded = this.calcNextLevelXP(user.level);
    }

    const oldLevel = user.level;
    await user.save();

    const wallet = await Wallet.findOne({ childId: userId });
    if (wallet) {
      wallet.experience = user.xp;
      wallet.currentLevel = user.level;
      await wallet.save();
    }

    if (leveledUp) {
      NotificationService.sendToUser(
        userId,
        'Level Up!',
        `You reached level ${user.level}: ${this.calcLevelTitle(user.level)}!`,
      ).catch(() => {});
    }

    await Activity.create({
      familyId: user.familyId,
      actorId: userId,
      type: 'xp_earned',
      message: leveledUp
        ? `${user.firstName} leveled up to ${user.level}!`
        : `${user.firstName} earned ${amount} XP`,
      metadata: { xpAwarded: amount, totalXP: user.xp, level: user.level, leveledUp, source },
    });

    if (leveledUp) {
      await this.evaluateMilestones(userId);
    }

    return {
      xpAwarded: amount,
      totalXP: user.xp,
      level: user.level,
      levelUp: leveledUp,
      newTitle: this.calcLevelTitle(user.level),
      nextLevelXP: this.calcNextLevelXP(user.level),
    };
  }

  // ===========================================================================
  // ACHIEVEMENTS
  // ===========================================================================

  static async evaluateAchievement(
    userId: string,
    criteriaType: string,
    currentValue: number,
  ): Promise<Array<Record<string, unknown>>> {
    const definitions = await AchievementDefinition.find({
      'criteria.type': criteriaType,
      isActive: true,
    }).lean();

    const user = await User.findById(userId);
    if (!user) return [];

    const unlocked: Array<Record<string, unknown>> = [];

    for (const def of definitions) {
      const existing = (user.achievements ?? []).find(
        (a) => a.achievementId?.toString() === def._id.toString(),
      );

      if (existing?.unlockedAt) continue;

      const target = def.criteria.value;
      if (currentValue >= target) {
        await this.unlockAchievement(userId, def._id.toString());
        unlocked.push({
          achievementId: def._id,
          key: def.key,
          title: def.title,
          tier: def.tier,
          rewards: def.rewards,
        });
      }
    }

    return unlocked;
  }

  static async unlockAchievement(
    userId: string,
    achievementId: string,
  ): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const existing = (user.achievements ?? []).find(
      (a) => a.achievementId?.toString() === achievementId,
    );
    if (existing?.unlockedAt) {
      return { alreadyUnlocked: true };
    }

    const def = await AchievementDefinition.findById(achievementId);
    if (!def) throw new Error('Achievement definition not found');

    if (existing) {
      existing.unlockedAt = new Date();
    } else {
      user.achievements!.push({
        achievementId: new Types.ObjectId(achievementId),
        progress: def.criteria.value,
        target: def.criteria.value,
        unlockedAt: new Date(),
        notified: false,
      });
    }

    await user.save();

    if (def.rewards.xp > 0) {
      await this.addXP(userId, def.rewards.xp, 'achievement', achievementId);
    }

    if (def.rewards.points && def.rewards.points > 0) {
      try {
        await RewardService.awardPoints(userId, 'achievement_reward', def.rewards.points, 'system', achievementId, `Achievement: ${def.title}`, userId);
      } catch {
        // wallet may not exist
      }
    }

    if (def.rewards.coins && def.rewards.coins > 0) {
      try {
        const wallet = await Wallet.findOne({ childId: userId });
        if (wallet) {
          wallet.redeemCoins += def.rewards.coins;
          await wallet.save();
        }
      } catch {
        // ignore
      }
    }

    if (def.rewards.badgeId) {
      await this.unlockBadge(userId, def.rewards.badgeId.toString());
    }

    NotificationService.sendToUser(
      userId,
      'Achievement Unlocked!',
      `You earned "${def.title}"!`,
    ).catch(() => {});

    await Activity.create({
      familyId: user.familyId,
      actorId: userId,
      type: 'achievement_unlocked',
      message: `${user.firstName} unlocked achievement "${def.title}"`,
      metadata: { achievementId, key: def.key, tier: def.tier },
    });

    await this.evaluateMilestones(userId);

    return {
      achievementId,
      key: def.key,
      title: def.title,
      tier: def.tier,
      rewards: def.rewards,
    };
  }

  static async getUserAchievements(userId: string) {
    const user = await User.findById(userId)
      .select('achievements')
      .lean();

    const definitions = await AchievementDefinition.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const achievementMap = new Map(
      (user?.achievements ?? []).filter((a) => a.achievementId).map((a) => [a.achievementId!.toString(), a]),
    );

    return definitions.map((def) => {
      const progress = achievementMap.get(def._id.toString());
      return {
        ...def,
        progress: progress?.progress ?? 0,
        target: def.criteria.value,
        unlockedAt: progress?.unlockedAt ?? null,
        notified: progress?.notified ?? false,
        isUnlocked: !!progress?.unlockedAt,
      };
    });
  }

  // ===========================================================================
  // BADGES
  // ===========================================================================

  static async unlockBadge(
    userId: string,
    badgeId: string,
  ): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const existing = (user.badges ?? []).find(
      (b) => b.badgeId?.toString() === badgeId,
    );
    if (existing?.unlockedAt) {
      return { alreadyUnlocked: true };
    }

    const def = await BadgeDefinition.findById(badgeId);
    if (!def) throw new Error('Badge definition not found');

    if (existing) {
      existing.unlockedAt = new Date();
    } else {
      user.badges!.push({
        badgeId: new Types.ObjectId(badgeId),
        unlockedAt: new Date(),
        notified: false,
      });
    }

    await user.save();

    NotificationService.sendToUser(
      userId,
      'Badge Earned!',
      `You earned the "${def.title}" badge!`,
    ).catch(() => {});

    await Activity.create({
      familyId: user.familyId,
      actorId: userId,
      type: 'badge_earned',
      message: `${user.firstName} earned badge "${def.title}"`,
      metadata: { badgeId, key: def.key, rarity: def.rarity },
    });

    return { badgeId, key: def.key, title: def.title, rarity: def.rarity };
  }

  static async getUserBadges(userId: string) {
    const user = await User.findById(userId)
      .select('badges')
      .lean();

    const definitions = await BadgeDefinition.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const badgeMap = new Map(
      (user?.badges ?? []).filter((b) => b.badgeId).map((b) => [b.badgeId!.toString(), b]),
    );

    return definitions.map((def) => ({
      ...def,
      unlockedAt: badgeMap.get(def._id.toString())?.unlockedAt ?? null,
      isUnlocked: !!badgeMap.get(def._id.toString())?.unlockedAt,
    }));
  }

  // ===========================================================================
  // CHALLENGES
  // ===========================================================================

  static async getActiveChallenges(type?: string) {
    const now = new Date();
    const filter: Record<string, unknown> = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };
    if (type) filter.type = type;
    return Challenge.find(filter).sort({ sortOrder: 1 }).lean();
  }

  static async getUserChallenges(userId: string, type?: string) {
    const user = await User.findById(userId)
      .select('challenges')
      .lean();

    const now = new Date();
    const filter: Record<string, unknown> = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };
    if (type) filter.type = type;

    const definitions = await Challenge.find(filter)
      .sort({ sortOrder: 1 })
      .lean();

    const challengeMap = new Map(
      (user?.challenges ?? []).map((c) => [c.challengeId?.toString(), c]),
    );

    return definitions.map((def) => {
      const progress = challengeMap.get(def._id.toString());
      return {
        ...def,
        progress: progress?.progress ?? 0,
        target: def.criteria.value,
        status: progress?.status ?? 'active',
        claimedAt: progress?.claimedAt ?? null,
      };
    });
  }

  static async updateChallengeProgress(
    userId: string,
    criteriaType: string,
    increment: number = 1,
  ): Promise<Array<Record<string, unknown>>> {
    const now = new Date();
    const activeChallenges = await Challenge.find({
      isActive: true,
      'criteria.type': criteriaType,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    if (!activeChallenges.length) return [];

    const user = await User.findById(userId);
    if (!user) return [];

    const completed: Array<Record<string, unknown>> = [];

    for (const challenge of activeChallenges) {
      const existing = (user.challenges ?? []).find(
        (c) => c.challengeId?.toString() === challenge._id.toString(),
      );

      if (existing && existing.status !== 'active') continue;

      const currentProgress = (existing?.progress ?? 0) + increment;
      const newProgress = Math.min(currentProgress, challenge.criteria.value);

      if (existing) {
        existing.progress = newProgress;
        if (newProgress >= challenge.criteria.value) {
          existing.status = 'active';
        }
      } else {
        user.challenges!.push({
          challengeId: new Types.ObjectId(challenge._id.toString()),
          progress: newProgress,
          target: challenge.criteria.value,
          status: 'active',
          claimedAt: undefined,
        });
      }

      if (newProgress >= challenge.criteria.value) {
        completed.push({
          challengeId: challenge._id,
          key: challenge.key,
          title: challenge.title,
          type: challenge.type,
          rewards: challenge.rewards,
        });
      }
    }

    await user.save();
    return completed;
  }

  static async claimChallengeReward(
    userId: string,
    challengeId: string,
  ): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const entry = (user.challenges ?? []).find(
      (c) => c.challengeId?.toString() === challengeId,
    );
    if (!entry) throw new Error('Challenge not active for user');
    if (entry.status !== 'active') throw new Error('Challenge already claimed or expired');
    if (entry.progress < entry.target) throw new Error('Challenge not yet completed');

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) throw new Error('Challenge definition not found');

    entry.status = 'claimed';
    entry.claimedAt = new Date();
    await user.save();

    if (challenge.rewards.xp > 0) {
      await this.addXP(userId, challenge.rewards.xp, 'challenge', challengeId);
    }

    if (challenge.rewards.points && challenge.rewards.points > 0) {
      try {
        await RewardService.awardPoints(userId, 'challenge_reward', challenge.rewards.points, 'system', challengeId, `Challenge: ${challenge.title}`, userId);
      } catch {
        // wallet may not exist
      }
    }

    if (challenge.rewards.coins && challenge.rewards.coins > 0) {
      try {
        const wallet = await Wallet.findOne({ childId: userId });
        if (wallet) {
          wallet.redeemCoins += challenge.rewards.coins;
          await wallet.save();
        }
      } catch {
        // ignore
      }
    }

    NotificationService.sendToUser(
      userId,
      'Challenge Complete!',
      `You completed "${challenge.title}" and earned the rewards!`,
    ).catch(() => {});

    await Activity.create({
      familyId: user.familyId,
      actorId: userId,
      type: 'challenge_completed',
      message: `${user.firstName} completed challenge "${challenge.title}"`,
      metadata: { challengeId, type: challenge.type, rewards: challenge.rewards },
    });

    return {
      challengeId,
      key: challenge.key,
      title: challenge.title,
      rewards: challenge.rewards,
    };
  }

  // ===========================================================================
  // STREAKS
  // ===========================================================================

  static async updateStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    isNewDay: boolean;
    streakBroken: boolean;
    streakBonus: number;
  }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompleted = user.lastCompletedAt
      ? new Date(user.lastCompletedAt)
      : null;

    let streakBroken = false;
    let isNewDay = false;

    if (!lastCompleted) {
      user.streak = 1;
      isNewDay = true;
    } else {
      const lastDay = new Date(lastCompleted);
      lastDay.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        isNewDay = false;
      } else if (diffDays === 1) {
        user.streak = (user.streak ?? 0) + 1;
        isNewDay = true;
      } else {
        user.streak = 1;
        streakBroken = true;
        isNewDay = true;
      }
    }

    if (isNewDay) {
      user.lastCompletedAt = today;
      await user.save();

      const longestStreak = Math.max(
        user.streak ?? 0,
        (user as any)._originalLongestStreak ?? user.streak ?? 0,
      );

      const streakBonus = this.calcStreakBonus(user.streak ?? 0);

      if (streakBonus > 0) {
        try {
          await RewardService.awardPoints(userId, 'streak_bonus', streakBonus, 'system', undefined, `${user.streak}-day streak bonus!`, userId);
        } catch {
          // wallet may not exist
        }

        await this.addXP(userId, streakBonus, 'streak', userId);
      }

      const milestones = [5, 10, 15, 20, 25, 30, 50, 75, 100];
      for (const milestone of milestones) {
        if ((user.streak ?? 0) === milestone) {
          try {
            await RewardService.awardPoints(userId, 'streak_bonus', streakBonus * 2, 'system', undefined, `${milestone}-day streak milestone!`, userId);
          } catch {
            // ignore
          }

          NotificationService.sendToUser(
            userId,
            'Streak Milestone!',
            `You reached a ${milestone}-day streak! Amazing!`,
          ).catch(() => {});

          await this.evaluateAchievement(userId, 'streak_count', user.streak ?? 0);
        }
      }

      return {
        currentStreak: user.streak ?? 0,
        longestStreak: longestStreak,
        isNewDay,
        streakBroken,
        streakBonus,
      };
    }

    return {
      currentStreak: user.streak ?? 0,
      longestStreak: user.streak ?? 0,
      isNewDay: false,
      streakBroken: false,
      streakBonus: 0,
    };
  }

  static calcStreakBonus(streak: number): number {
    if (streak >= 30) return 100;
    if (streak >= 21) return 75;
    if (streak >= 14) return 50;
    if (streak >= 7) return 30;
    if (streak >= 5) return 20;
    if (streak >= 3) return 10;
    return 0;
  }

  static async getStreakInfo(userId: string) {
    const user = await User.findById(userId)
      .select('streak lastCompletedAt')
      .lean();

    if (!user) throw new Error('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCompleted = user.lastCompletedAt
      ? new Date(user.lastCompletedAt)
      : null;

    let isAtRisk = false;
    let isBroken = false;

    if (lastCompleted) {
      const lastDay = new Date(lastCompleted);
      lastDay.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
      );
      isAtRisk = diffDays === 1;
      isBroken = diffDays > 1;
    }

    return {
      currentStreak: user.streak ?? 0,
      lastCompletedAt: user.lastCompletedAt,
      isAtRisk,
      isBroken,
      streakBonus: this.calcStreakBonus(user.streak ?? 0),
      nextStreakBonusAt: this.nextStreakBonusThreshold(user.streak ?? 0),
    };
  }

  static nextStreakBonusThreshold(streak: number): number {
    const thresholds = [3, 5, 7, 14, 21, 30];
    return thresholds.find((t) => t > streak) ?? 30;
  }

  // ===========================================================================
  // LOGIN REWARDS
  // ===========================================================================

  static async processLoginReward(userId: string): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLoginDate
      ? new Date(user.lastLoginDate)
      : null;

    let loginStreak = 0;
    let isFirstToday = false;

    if (!lastLogin) {
      user.loginStreakCount = 1;
      loginStreak = 1;
      isFirstToday = true;
    } else {
      const lastDay = new Date(lastLogin);
      lastDay.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        return { alreadyClaimed: true, loginStreakCount: user.loginStreakCount };
      } else if (diffDays === 1) {
        user.loginStreakCount = (user.loginStreakCount ?? 0) + 1;
        loginStreak = user.loginStreakCount;
        isFirstToday = true;
      } else {
        user.loginStreakCount = 1;
        loginStreak = 1;
        isFirstToday = true;
      }
    }

    if (isFirstToday) {
      user.lastLoginDate = today;
      await user.save();

      const dayNumber = loginStreak <= 30 ? loginStreak : (loginStreak % 30 || 30);

      const xpReward = Math.min(10 + dayNumber * 2, 100);
      const pointsReward = Math.min(5 + dayNumber, 50);

      await this.addXP(userId, xpReward, 'login', userId);
      try {
        await RewardService.awardPoints(userId, 'login_reward', pointsReward, 'system', undefined, `Day ${loginStreak} login reward`, userId);
      } catch {
        // wallet may not exist
      }

      await LoginRewardLog.create({
        userId: new Types.ObjectId(userId),
        loginDate: today,
        dayNumber: loginStreak,
        xpAwarded: xpReward,
        pointsAwarded: pointsReward,
        coinsAwarded: 0,
        claimedAt: new Date(),
      });

      await this.evaluateAchievement(userId, 'login_count', loginStreak);
      await this.updateChallengeProgress(userId, 'login_days');

      return {
        dayNumber: loginStreak,
        xpReward,
        pointsReward,
        loginStreakCount: loginStreak,
      };
    }

    return { loginStreakCount: user.loginStreakCount };
  }

  // ===========================================================================
  // MISSIONS / QUESTS
  // ===========================================================================

  static async getUserMissions(userId: string) {
    const user = await User.findById(userId)
      .select('achievements badges level completedMissions')
      .lean();

    const definitions = await MissionDefinition.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    if (!user) return [];

    const completedIds = new Set(
      (user.completedMissions ?? []).map((m) => m.missionId?.toString()),
    );

    const userAchievementIds = new Set(
      (user.achievements ?? []).filter((a) => a.unlockedAt && a.achievementId).map((a) => a.achievementId!.toString()),
    );
    const userBadgeIds = new Set(
      (user.badges ?? []).filter((b) => b.unlockedAt && b.badgeId).map((b) => b.badgeId!.toString()),
    );

    return definitions.map((def) => {
      const isCompleted = completedIds.has(def._id.toString());
      const prerequisitesMet = (def.prerequisites ?? []).every((p) => {
        if (p.type === 'achievement') return userAchievementIds.has(p.id);
        if (p.type === 'badge') return userBadgeIds.has(p.id);
        if (p.type === 'level') return (user.level ?? 1) >= parseInt(p.id, 10);
        if (p.type === 'mission') return completedIds.has(p.id);
        return false;
      });

      return {
        ...def,
        isCompleted,
        prerequisitesMet,
        canStart: prerequisitesMet && !isCompleted,
      };
    });
  }

  static async completeMission(
    userId: string,
    missionId: string,
  ): Promise<Record<string, unknown>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const alreadyCompleted = (user.completedMissions ?? []).find(
      (m) => m.missionId?.toString() === missionId,
    );
    if (alreadyCompleted) return { alreadyCompleted: true };

    const def = await MissionDefinition.findById(missionId);
    if (!def) throw new Error('Mission not found');

    user.completedMissions!.push({
      missionId: new Types.ObjectId(missionId),
      completedAt: new Date(),
    });
    await user.save();

    if (def.rewards.xp > 0) {
      await this.addXP(userId, def.rewards.xp, 'mission', missionId);
    }

    if (def.rewards.points && def.rewards.points > 0) {
      try {
        await RewardService.awardPoints(userId, 'achievement_reward', def.rewards.points, 'system', missionId, `Mission: ${def.title}`, userId);
      } catch {
        // ignore
      }
    }

    if (def.rewards.coins && def.rewards.coins > 0) {
      try {
        const wallet = await Wallet.findOne({ childId: userId });
        if (wallet) {
          wallet.redeemCoins += def.rewards.coins;
          await wallet.save();
        }
      } catch {
        // ignore
      }
    }

    if (def.rewards.badgeId) {
      await this.unlockBadge(userId, def.rewards.badgeId.toString());
    }

    NotificationService.sendToUser(
      userId,
      'Mission Complete!',
      `You completed the mission "${def.title}"!`,
    ).catch(() => {});

    await Activity.create({
      familyId: user.familyId,
      actorId: userId,
      type: 'mission_completed',
      message: `${user.firstName} completed mission "${def.title}"`,
      metadata: { missionId, key: def.key },
    });

    return { missionId, key: def.key, title: def.title, rewards: def.rewards };
  }

  // ===========================================================================
  // MILESTONES
  // ===========================================================================

  static async evaluateMilestones(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const definitions = await MilestoneDefinition.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const completed: Array<Record<string, unknown>> = [];

    for (const def of definitions) {
      const alreadyDone = (user.completedMilestones ?? []).find(
        (m) => m.milestoneId?.toString() === def._id.toString(),
      );
      if (alreadyDone) continue;

      let achieved = false;
      switch (def.criteria.type) {
        case 'level_reach':
          achieved = (user.level ?? 1) >= def.criteria.value;
          break;
        case 'xp_total':
          achieved = (user.xp ?? 0) >= def.criteria.value;
          break;
        case 'points_total':
          achieved = (user.points ?? 0) >= def.criteria.value;
          break;
        case 'streak_days':
          achieved = (user.streak ?? 0) >= def.criteria.value;
          break;
        case 'tasks_completed': {
          const taskCount = await RewardTransaction.countDocuments({
            userId,
            actionType: 'task_completed',
          });
          achieved = taskCount >= def.criteria.value;
          break;
        }
        case 'games_played': {
          const played = (user.chessGamesPlayed ?? 0)
            + (user.memoryGamesPlayed ?? 0)
            + (user.mathGamesPlayed ?? 0)
            + (user.patternGamesPlayed ?? 0)
            + (user.puzzleGamesPlayed ?? 0);
          achieved = played >= def.criteria.value;
          break;
        }
        case 'logins_total': {
          const loginCount = await LoginRewardLog.countDocuments({ userId });
          achieved = loginCount >= def.criteria.value;
          break;
        }
      }

      if (achieved) {
        user.completedMilestones!.push({
          milestoneId: new Types.ObjectId(def._id.toString()),
          completedAt: new Date(),
        });

        if (def.rewards.xp > 0) {
          await this.addXP(userId, def.rewards.xp, 'milestone', def._id.toString());
        }

        if (def.rewards.points && def.rewards.points > 0) {
          try {
            await RewardService.awardPoints(userId, 'achievement_reward', def.rewards.points, 'system', def._id.toString(), `Milestone: ${def.title}`, userId);
          } catch {
            // ignore
          }
        }

        if (def.rewards.coins && def.rewards.coins > 0) {
          try {
            const wallet = await Wallet.findOne({ childId: userId });
            if (wallet) {
              wallet.redeemCoins += def.rewards.coins;
              await wallet.save();
            }
          } catch {
            // ignore
          }
        }

        completed.push({
          milestoneId: def._id,
          key: def.key,
          title: def.title,
          rewards: def.rewards,
        });
      }
    }

    await user.save();
    return completed;
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  static async getActiveEvents() {
    const now = new Date();
    return GamificationEvent.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .lean();
  }

  static async getActiveMultiplier(
    actionType?: string,
    gameType?: string,
    role?: string,
  ): Promise<number> {
    const now = new Date();
    const events = await GamificationEvent.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      type: { $in: ['xp_boost', 'points_boost', 'coins_boost'] },
    }).lean();

    let multiplier = 1.0;

    for (const event of events) {
      const criteria = event.targetCriteria;
      if (!criteria) {
        multiplier = Math.max(multiplier, event.multiplier);
        continue;
      }

      const matchesAction = !criteria.actionTypes?.length
        || (actionType && criteria.actionTypes.includes(actionType));
      const matchesGame = !criteria.gameTypes?.length
        || (gameType && criteria.gameTypes.includes(gameType));
      const matchesRole = !criteria.roles?.length
        || (role && criteria.roles.includes(role));

      if (matchesAction && matchesGame && matchesRole) {
        multiplier = Math.max(multiplier, event.multiplier);
      }
    }

    return multiplier;
  }

  // ===========================================================================
  // PROGRESS & ANALYTICS
  // ===========================================================================

  static async getUserProgress(userId: string) {
    const user = await User.findById(userId)
      .select('xp level streak points achievements badges challenges completedMissions completedMilestones loginStreakCount lastLoginDate skillXP')
      .lean();
    if (!user) throw new Error('User not found');

    const totalAchievements = await AchievementDefinition.countDocuments({ isActive: true });
    const totalBadges = await BadgeDefinition.countDocuments({ isActive: true });
    const unlockedAchievements = (user.achievements ?? []).filter((a) => a.unlockedAt).length;
    const unlockedBadges = (user.badges ?? []).filter((b) => b.unlockedAt).length;
    const missionsCompleted = (user.completedMissions ?? []).length;
    const milestonesCompleted = (user.completedMilestones ?? []).length;

    return {
      level: user.level,
      xp: user.xp,
      nextLevelXP: this.calcNextLevelXP(user.level),
      title: this.calcLevelTitle(user.level),
      streak: user.streak,
      points: user.points,
      skillXP: user.skillXP,
      achievements: {
        unlocked: unlockedAchievements,
        total: totalAchievements,
        progress: totalAchievements > 0 ? unlockedAchievements / totalAchievements : 0,
      },
      badges: {
        unlocked: unlockedBadges,
        total: totalBadges,
        progress: totalBadges > 0 ? unlockedBadges / totalBadges : 0,
      },
      challenges: {
        active: (user.challenges ?? []).filter((c) => c.status === 'active').length,
        claimed: (user.challenges ?? []).filter((c) => c.status === 'claimed').length,
      },
      missionsCompleted,
      milestonesCompleted,
      loginStreak: user.loginStreakCount,
    };
  }

  static async getLeaderboard(
    familyId?: string,
    school?: string,
    type: 'xp' | 'level' | 'streak' | 'points' = 'xp',
    limit: number = 50,
  ) {
    const sortField = type === 'level' ? 'level' : type === 'streak' ? 'streak' : type === 'points' ? 'points' : 'xp';
    const query: Record<string, unknown> = { role: ROLES.CHILD };
    if (familyId) query.familyId = familyId;
    if (school) query.school = school;

    return User.find(query)
      .select(`firstName lastName avatar ${sortField} streak level school`)
      .sort({ [sortField]: -1, streak: -1 })
      .limit(limit)
      .lean();
  }

  static async getPlatformAnalytics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalAchievements,
      totalBadges,
      totalChallenges,
      achievementsUnlockedToday,
      challengesCompletedToday,
      activeStreaks,
      totalXP,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.CHILD }),
      AchievementDefinition.countDocuments({ isActive: true }),
      BadgeDefinition.countDocuments({ isActive: true }),
      Challenge.countDocuments({ isActive: true }),
      Activity.countDocuments({ type: 'achievement_unlocked', createdAt: { $gte: todayStart } }),
      Activity.countDocuments({ type: 'challenge_completed', createdAt: { $gte: todayStart } }),
      User.countDocuments({ role: ROLES.CHILD, streak: { $gte: 3 } }),
      User.aggregate([
        { $match: { role: ROLES.CHILD } },
        { $group: { _id: null, total: { $sum: '$xp' } } },
      ]),
    ]);

    return {
      totalUsers,
      totalAchievements,
      totalBadges,
      totalChallenges,
      achievementsUnlockedToday,
      challengesCompletedToday,
      activeStreaks,
      totalXP: totalXP[0]?.total ?? 0,
      avgXP: totalUsers > 0 ? Math.round((totalXP[0]?.total ?? 0) / totalUsers) : 0,
    };
  }

  // ===========================================================================
  // ADMIN: CRUD for definitions
  // ===========================================================================

  // -- Achievements --
  static async listAchievements() {
    return AchievementDefinition.find().sort({ sortOrder: 1 }).lean();
  }

  static async createAchievement(data: Record<string, unknown>) {
    return AchievementDefinition.create(data);
  }

  static async updateAchievement(id: string, data: Record<string, unknown>) {
    return AchievementDefinition.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async deleteAchievement(id: string) {
    return AchievementDefinition.findByIdAndDelete(id).lean();
  }

  // -- Badges --
  static async listBadges() {
    return BadgeDefinition.find().sort({ sortOrder: 1 }).lean();
  }

  static async createBadge(data: Record<string, unknown>) {
    return BadgeDefinition.create(data);
  }

  static async updateBadge(id: string, data: Record<string, unknown>) {
    return BadgeDefinition.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async deleteBadge(id: string) {
    return BadgeDefinition.findByIdAndDelete(id).lean();
  }

  // -- Challenges --
  static async listAllChallenges() {
    return Challenge.find().sort({ type: 1, sortOrder: 1 }).lean();
  }

  static async createChallenge(data: Record<string, unknown>) {
    return Challenge.create(data);
  }

  static async updateChallenge(id: string, data: Record<string, unknown>) {
    return Challenge.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async deleteChallenge(id: string) {
    return Challenge.findByIdAndDelete(id).lean();
  }

  // -- Events --
  static async listEvents() {
    return GamificationEvent.find().sort({ startDate: -1 }).lean();
  }

  static async createEvent(data: Record<string, unknown>) {
    return GamificationEvent.create(data);
  }

  static async updateEvent(id: string, data: Record<string, unknown>) {
    return GamificationEvent.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async deleteEvent(id: string) {
    return GamificationEvent.findByIdAndDelete(id).lean();
  }

  // -- Missions --
  static async listMissions() {
    return MissionDefinition.find().sort({ sortOrder: 1 }).lean();
  }

  static async createMission(data: Record<string, unknown>) {
    return MissionDefinition.create(data);
  }

  static async updateMission(id: string, data: Record<string, unknown>) {
    return MissionDefinition.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async deleteMission(id: string) {
    return MissionDefinition.findByIdAndDelete(id).lean();
  }

  // -- Milestones --
  static async listMilestones() {
    return MilestoneDefinition.find().sort({ sortOrder: 1 }).lean();
  }

  static async createMilestone(data: Record<string, unknown>) {
    return MilestoneDefinition.create(data);
  }

  static async updateMilestone(id: string, data: Record<string, unknown>) {
    return MilestoneDefinition.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  static async deleteMilestone(id: string) {
    return MilestoneDefinition.findByIdAndDelete(id).lean();
  }
}
