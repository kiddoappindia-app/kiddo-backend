import { RewardConfig, IRewardConfig } from '../models/analytics.model.js';
import { Streak, IStreak } from '../models/streak.model.js';

export interface RewardCalculation {
  basePoints: number;
  difficultyMultiplier: number;
  difficultyBonus: number;
  speedBonus: number;
  morningBonus: number;
  weekendBonus: number;
  holidayBonus: number;
  streakBonus: number;
  perfectBonus: number;
  teacherBonus: number;
  parentBonus: number;
  totalPoints: number;
  totalCoins: number;
  totalXp: number;
  bonuses: Record<string, number>;
}

export class RewardEngine {
  static async calculate(
    familyId: string,
    params: {
      basePoints: number;
      difficulty: string;
      timeSpentMinutes: number;
      completedAt: Date;
      streakCount: number;
      isPerfectDay: boolean;
      isPerfectWeek: boolean;
      isPerfectMonth: boolean;
      isTeacherApproved?: boolean;
      isParentBonus?: boolean;
      isHoliday?: boolean;
    },
  ): Promise<RewardCalculation> {
    let config = await RewardConfig.findOne({ familyId });
    if (!config) {
      config = await RewardConfig.create({ familyId });
    }

    const difficultyMultiplier = config.difficultyMultipliers[params.difficulty as keyof typeof config.difficultyMultipliers] || 1.0;
    const difficultyBonus = Math.round(params.basePoints * difficultyMultiplier) - params.basePoints;

    let speedBonus = 0;
    if (params.timeSpentMinutes > 0 && params.timeSpentMinutes <= config.speedBonusThreshold) {
      speedBonus = Math.round(params.basePoints * (config.speedBonusMultiplier - 1));
    }

    const hour = params.completedAt.getHours();
    let morningBonus = 0;
    if (hour >= config.morningBonusStart && hour <= config.morningBonusEnd) {
      morningBonus = config.morningBonusPoints;
    }

    const dayOfWeek = params.completedAt.getDay();
    const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? config.weekendBonusPoints : 0;

    const holidayBonus = params.isHoliday ? config.holidayBonusPoints : 0;

    let streakBonus = 0;
    const streakThresholds = Object.keys(config.streakBonuses).sort((a, b) => Number(b) - Number(a));
    for (const threshold of streakThresholds) {
      if (params.streakCount >= Number(threshold)) {
        streakBonus = (config.streakBonuses as any)[threshold];
        break;
      }
    }

    let perfectBonus = 0;
    if (params.isPerfectMonth) perfectBonus = config.perfectMonthBonus;
    else if (params.isPerfectWeek) perfectBonus = config.perfectWeekBonus;
    else if (params.isPerfectDay) perfectBonus = config.perfectDayBonus;

    const teacherBonus = params.isTeacherApproved
      ? Math.round(params.basePoints * (config.teacherBonusMultiplier - 1))
      : 0;

    const parentBonus = params.isParentBonus
      ? Math.round(params.basePoints * (config.parentBonusMultiplier - 1))
      : 0;

    const totalPoints = params.basePoints + difficultyBonus + speedBonus + morningBonus + weekendBonus + holidayBonus + streakBonus + perfectBonus + teacherBonus + parentBonus;
    const totalCoins = Math.round(totalPoints * config.coinsPerPoint);
    const totalXp = Math.round(totalPoints * config.xpPerPoint);

    return {
      basePoints: params.basePoints,
      difficultyMultiplier,
      difficultyBonus,
      speedBonus,
      morningBonus,
      weekendBonus,
      holidayBonus,
      streakBonus,
      perfectBonus,
      teacherBonus,
      parentBonus,
      totalPoints,
      totalCoins,
      totalXp,
      bonuses: {
        difficulty: difficultyBonus,
        speed: speedBonus,
        morning: morningBonus,
        weekend: weekendBonus,
        holiday: holidayBonus,
        streak: streakBonus,
        perfect: perfectBonus,
        teacher: teacherBonus,
        parent: parentBonus,
      },
    };
  }

  static async calculatePreview(
    familyId: string,
    params: {
      basePoints: number;
      difficulty: string;
      timeSpentMinutes: number;
      streakCount: number;
    },
  ): Promise<RewardCalculation> {
    return this.calculate(familyId, {
      ...params,
      completedAt: new Date(),
      isPerfectDay: false,
      isPerfectWeek: false,
      isPerfectMonth: false,
    });
  }
}
