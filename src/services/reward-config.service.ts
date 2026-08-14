import { RewardConfig } from '../models/reward-config.model.js';

export class RewardConfigService {
  async getConfigs(category?: string): Promise<any[]> {
    const query: any = {};
    if (category) query.category = category;
    return RewardConfig.find(query).sort({ category: 1, key: 1 }).lean();
  }

  async getConfigByKey(key: string): Promise<any> {
    return RewardConfig.findOne({ key }).lean();
  }

  async createConfig(data: any, userId: string): Promise<any> {
    return RewardConfig.create({ ...data, updatedBy: userId });
  }

  async updateConfig(key: string, data: any, userId: string): Promise<any> {
    return RewardConfig.findOneAndUpdate(
      { key },
      { ...data, updatedBy: userId, $inc: { version: 1 } },
      { new: true },
    );
  }

  async deleteConfig(key: string): Promise<void> {
    await RewardConfig.findOneAndDelete({ key });
  }

  async toggleConfig(key: string, enabled: boolean): Promise<any> {
    return RewardConfig.findOneAndUpdate({ key }, { enabled }, { new: true });
  }

  async calculateReward(configKey: string, context: {
    difficulty?: string;
    streak?: number;
    isHoliday?: boolean;
    isSchool?: boolean;
  }): Promise<{ points: number; xp: number; coins: number }> {
    const config = await RewardConfig.findOne({ key: configKey, enabled: true });
    if (!config) return { points: 0, xp: 0, coins: 0 };
    const { formula } = config as any;
    let multiplier = 1;
    if (context.difficulty && formula.multipliers?.difficulty) {
      multiplier *= formula.multipliers.difficulty.get(context.difficulty) || 1;
    }
    if (context.streak && formula.multipliers?.streak) {
      const streakKeys = Array.from(formula.multipliers.streak.keys()).map(Number).sort((a, b) => b - a);
      for (const threshold of streakKeys) {
        if (context.streak >= threshold) {
          multiplier *= formula.multipliers.streak.get(String(threshold));
          break;
        }
      }
    }
    if (context.isHoliday) multiplier *= formula.multipliers?.holiday || 1;
    if (context.isSchool) multiplier *= formula.multipliers?.school || 1;
    const base = formula.base;
    const points = Math.min(Math.round(base * multiplier), formula.caps?.perTaskMax || Infinity);
    return { points, xp: Math.round(points * 1.5), coins: Math.round(points * 0.5) };
  }

  async getActiveConfigs(): Promise<any[]> {
    const now = new Date();
    return RewardConfig.find({
      enabled: true,
      $or: [
        { effectiveFrom: null },
        { effectiveFrom: { $lte: now } },
      ],
      $and: [
        { $or: [{ effectiveUntil: null }, { effectiveUntil: { $gte: now } }] },
      ],
    }).lean();
  }
}
