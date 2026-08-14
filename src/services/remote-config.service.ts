import { RemoteConfig } from '../models/remote-config.model.js';

export class RemoteConfigService {
  async getConfig(key: string, scope?: string, scopeId?: string): Promise<any> {
    const query: any = { key, enabled: true };
    if (scope) query.scope = scope;
    if (scopeId) query.scopeId = scopeId;
    const now = new Date();
    query.$or = [{ startAt: null }, { startAt: { $lte: now } }];
    query.$and = [{ $or: [{ endAt: null }, { endAt: { $gte: now } }] }];
    return RemoteConfig.findOne(query).sort({ scope: 1, priority: -1 }).lean();
  }

  async getConfigsByCategory(category: string): Promise<any[]> {
    return RemoteConfig.find({ category, enabled: true }).lean();
  }

  async getAllConfigs(): Promise<any[]> {
    return RemoteConfig.find().sort({ category: 1, key: 1 }).lean();
  }

  async setConfig(data: any, userId: string): Promise<any> {
    const existing = await RemoteConfig.findOne({ key: data.key });
    if (existing) {
      existing.changeLog.push({
        oldValue: existing.value,
        newValue: data.value,
        changedBy: userId,
        changedAt: new Date(),
        reason: data.reason,
      });
      Object.assign(existing, data, { updatedBy: userId, $inc: { version: 1 } });
      return existing.save();
    }
    return RemoteConfig.create({ ...data, updatedBy: userId, changeLog: [{
      oldValue: null,
      newValue: data.value,
      changedBy: userId,
      changedAt: new Date(),
      reason: data.reason,
    }] });
  }

  async deleteConfig(key: string): Promise<void> {
    await RemoteConfig.findOneAndDelete({ key });
  }

  async getChangeLog(key: string): Promise<any[]> {
    const doc = await RemoteConfig.findOne({ key }).lean();
    return doc?.changeLog || [];
  }

  async getClientConfig(deviceVersion?: string): Promise<Record<string, any>> {
    const configs = await RemoteConfig.find({ enabled: true }).lean();
    const result: Record<string, any> = {};
    for (const cfg of configs) {
      if (deviceVersion && cfg.key.includes('min_version')) continue;
      result[cfg.key] = cfg.value;
    }
    return result;
  }
}
