import { FeatureFlag } from '../models/feature-flag.model.js';

export class FeatureFlagService {
  async getFlags(category?: string): Promise<any[]> {
    const query: any = {};
    if (category) query.category = category;
    return FeatureFlag.find(query).sort({ category: 1, key: 1 }).lean();
  }

  async getFlagByKey(key: string): Promise<any> {
    return FeatureFlag.findOne({ key }).lean();
  }

  async createFlag(data: any, userId: string): Promise<any> {
    return FeatureFlag.create({ ...data, updatedBy: userId });
  }

  async updateFlag(key: string, data: any, userId: string): Promise<any> {
    const flag = await FeatureFlag.findOne({ key });
    if (!flag) throw new Error('Flag not found');
    flag.changeLog.push({
      enabled: flag.enabled,
      percentage: flag.rollout?.percentage || 0,
      changedBy: userId,
      changedAt: new Date(),
      reason: data.reason,
    });
    Object.assign(flag, data, { updatedBy: userId });
    return flag.save();
  }

  async toggleFlag(key: string, enabled: boolean, userId: string): Promise<any> {
    return this.updateFlag(key, { enabled }, userId);
  }

  async setRollout(key: string, percentage: number, userId: string): Promise<any> {
    return this.updateFlag(key, { 'rollout.percentage': percentage }, userId);
  }

  async deleteFlag(key: string): Promise<void> {
    await FeatureFlag.findOneAndDelete({ key });
  }

  async isEnabled(key: string, context?: { userId?: string; schoolId?: string; familyId?: string }): Promise<boolean> {
    const flag = await FeatureFlag.findOne({ key });
    if (!flag || !flag.enabled) return false;
    const { rollout } = flag as any;
    if (!rollout) return true;
    if (rollout.whitelist?.length && context?.userId) {
      return rollout.whitelist.includes(context.userId);
    }
    if (rollout.blacklist?.length && context?.userId) {
      if (rollout.blacklist.includes(context.userId)) return false;
    }
    if (rollout.percentage >= 100) return true;
    if (rollout.percentage <= 0) return false;
    if (context?.userId) {
      const hash = this.simpleHash(context.userId + key);
      return (hash % 100) < rollout.percentage;
    }
    return Math.random() * 100 < rollout.percentage;
  }

  async getEnabledFlags(context?: { userId?: string; schoolId?: string; familyId?: string }): Promise<Record<string, boolean>> {
    const flags = await FeatureFlag.find({ enabled: true }).lean();
    const result: Record<string, boolean> = {};
    for (const flag of flags) {
      result[flag.key] = await this.isEnabled(flag.key, context);
    }
    return result;
  }

  async getChangeLog(key: string): Promise<any[]> {
    const flag = await FeatureFlag.findOne({ key }).lean();
    return (flag as any)?.changeLog || [];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }
}
