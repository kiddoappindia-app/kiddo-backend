import { ParentControls } from '../models/parent-controls.model.js';
import { Logger } from '../utils/logger.js';

export class ParentControlsService {
  static async getControls(childId: string) {
    let controls = await ParentControls.findOne({ childId });
    if (!controls) {
      controls = new ParentControls({
        childId,
        familyId: 'unknown',
      });
      await controls.save();
    }
    return controls;
  }

  static async updateControls(childId: string, updates: Partial<typeof ParentControls.prototype>) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) throw new Error('Parent controls not found');

    Object.assign(controls, updates);
    await controls.save();
    Logger.info(`Parent controls updated for child ${childId}`);
    return controls;
  }

  static async updateAccessibility(childId: string, accessibility: typeof ParentControls.prototype.accessibility) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) throw new Error('Parent controls not found');

    controls.accessibility = { ...controls.accessibility, ...accessibility };
    await controls.save();
    return controls;
  }

  static async updateFeatureToggles(childId: string, toggles: typeof ParentControls.prototype.featureToggles) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) throw new Error('Parent controls not found');

    controls.featureToggles = { ...controls.featureToggles, ...toggles };
    await controls.save();
    return controls;
  }

  static async updateStoreVisibility(childId: string, visibility: typeof ParentControls.prototype.storeVisibility) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) throw new Error('Parent controls not found');

    controls.storeVisibility = { ...controls.storeVisibility, ...visibility };
    await controls.save();
    return controls;
  }

  static async updateRewardMultipliers(childId: string, multipliers: typeof ParentControls.prototype.rewardMultipliers) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) throw new Error('Parent controls not found');

    controls.rewardMultipliers = { ...controls.rewardMultipliers, ...multipliers };
    await controls.save();
    return controls;
  }

  static async updateSchedule(childId: string, schedule: typeof ParentControls.prototype.schedule) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) throw new Error('Parent controls not found');

    controls.schedule = { ...controls.schedule, ...schedule };
    await controls.save();
    return controls;
  }

  static async checkPlayTime(childId: string) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) return { allowed: true, remaining: 999 };

    const now = new Date();
    const resetDate = new Date(controls.playTimeResetAt);
    if (now.toDateString() !== resetDate.toDateString()) {
      controls.playTimeUsedMinutes = 0;
      controls.playTimeResetAt = now;
      await controls.save();
    }

    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const limit = isWeekend ? controls.schedule.weekendPlayLimit : controls.schedule.weekdayPlayLimit;
    const remaining = Math.max(0, limit - controls.playTimeUsedMinutes);

    return {
      allowed: remaining > 0,
      remaining,
      limit,
      used: controls.playTimeUsedMinutes,
    };
  }

  static async logPlayTime(childId: string, minutes: number) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) return;

    const now = new Date();
    const resetDate = new Date(controls.playTimeResetAt);
    if (now.toDateString() !== resetDate.toDateString()) {
      controls.playTimeUsedMinutes = 0;
      controls.playTimeResetAt = now;
    }

    controls.playTimeUsedMinutes += minutes;
    await controls.save();
  }

  static async isGameAllowed(childId: string, gameId: string) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) return true;
    if (!controls.featureToggles.miniGamesEnabled) return false;
    return controls.allowedGames.includes(gameId);
  }

  static async isFeatureEnabled(childId: string, feature: string) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) return true;
    const featureKey = `${feature}Enabled` as keyof typeof controls.featureToggles;
    return (controls.featureToggles as any)[featureKey] ?? true;
  }

  static async isQuietHours(childId: string) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) return false;

    const now = new Date();
    const hour = now.getHours();
    const start = controls.schedule.quietHoursStart;
    const end = controls.schedule.quietHoursEnd;

    if (start > end) {
      return hour >= start || hour < end;
    }
    return hour >= start && hour < end;
  }

  static async getBlockedContent(childId: string) {
    const controls = await ParentControls.findOne({ childId });
    if (!controls) return { items: [], pets: [], areas: [], games: [] };
    return {
      items: controls.contentFilters.blockedItems,
      pets: controls.contentFilters.blockedPets,
      areas: controls.contentFilters.blockedAreas,
      games: controls.contentFilters.blockedGames,
    };
  }
}
