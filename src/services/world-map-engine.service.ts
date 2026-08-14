import { WorldArea, WorldProgress } from '../models/world-map.model.js';
import { Logger } from '../utils/logger.js';

export class WorldMapEngineService {
  static async getAllAreas() {
    return WorldArea.find({ isActive: true }).sort({ sortOrder: 1 });
  }

  static async getArea(areaId: string) {
    return WorldArea.findOne({ id: areaId, isActive: true });
  }

  static async getChildProgress(childId: string) {
    let progress = await WorldProgress.findOne({ childId });
    if (!progress) {
      progress = new WorldProgress({
        childId,
        familyId: 'unknown',
        unlockedAreas: ['home'],
        currentArea: 'home',
      });
      await progress.save();
    }
    return progress;
  }

  static async travelToArea(childId: string, areaId: string) {
    const progress = await WorldProgress.findOne({ childId });
    if (!progress) throw new Error('World progress not found');

    if (!progress.unlockedAreas.includes(areaId)) {
      throw new Error('Area is locked. Complete requirements to unlock.');
    }

    progress.currentArea = areaId;
    if (!progress.visitedAreas.includes(areaId)) {
      progress.visitedAreas.push(areaId);
    }
    await progress.save();
    return progress;
  }

  static async unlockArea(childId: string, areaId: string) {
    const progress = await WorldProgress.findOne({ childId });
    if (!progress) throw new Error('World progress not found');

    if (progress.unlockedAreas.includes(areaId)) {
      throw new Error('Area already unlocked');
    }

    const area = await WorldArea.findOne({ id: areaId, isActive: true });
    if (!area) throw new Error('Area not found');

    progress.unlockedAreas.push(areaId);
    await progress.save();
    Logger.info(`Area ${areaId} unlocked for child ${childId}`);
    return progress;
  }

  static async checkAndUnlockAreas(childId: string, stats: {
    level: number;
    achievementsCount: number;
    longestStreak: number;
    tasksCompleted: number;
    xpTotal: number;
  }) {
    const areas = await WorldArea.find({ isActive: true, isUnlockedByDefault: false });
    const progress = await WorldProgress.findOne({ childId });
    if (!progress) return [];

    const newlyUnlocked: string[] = [];

    for (const area of areas) {
      if (progress.unlockedAreas.includes(area.id)) continue;

      const meetsAll = area.unlockRequirements.every(req => {
        switch (req.type) {
          case 'level': return stats.level >= req.value;
          case 'achievement': return stats.achievementsCount >= req.value;
          case 'streak': return stats.longestStreak >= req.value;
          case 'tasks_completed': return stats.tasksCompleted >= req.value;
          case 'xp_total': return stats.xpTotal >= req.value;
          default: return false;
        }
      });

      if (meetsAll) {
        progress.unlockedAreas.push(area.id);
        newlyUnlocked.push(area.id);
      }
    }

    if (newlyUnlocked.length > 0) {
      await progress.save();
      Logger.info(`Areas unlocked for child ${childId}: ${newlyUnlocked.join(', ')}`);
    }

    return newlyUnlocked;
  }

  static async collectCollectible(childId: string, areaId: string, collectibleId: string) {
    const progress = await WorldProgress.findOne({ childId });
    if (!progress) throw new Error('World progress not found');

    if (progress.collectiblesFound.includes(collectibleId)) {
      throw new Error('Already collected');
    }

    const area = await WorldArea.findOne({ id: areaId });
    if (!area) throw new Error('Area not found');

    const collectible = area.collectibles.find(c => c.id === collectibleId);
    if (!collectible) throw new Error('Collectible not found in this area');

    progress.collectiblesFound.push(collectibleId);
    await progress.save();
    return { collectible, progress };
  }

  static async interactWithNpc(childId: string, areaId: string, npcId: string) {
    const progress = await WorldProgress.findOne({ childId });
    if (!progress) throw new Error('World progress not found');

    const interactionKey = `${areaId}:${npcId}`;
    if (!progress.npcsInteracted.includes(interactionKey)) {
      progress.npcsInteracted.push(interactionKey);
      await progress.save();
    }

    const area = await WorldArea.findOne({ id: areaId });
    const npc = area?.npcs.find(n => n.id === npcId);
    return npc || null;
  }

  static async getWorldStats(childId: string) {
    const progress = await WorldProgress.findOne({ childId });
    const totalAreas = await WorldArea.countDocuments({ isActive: true });
    return {
      unlockedAreas: progress?.unlockedAreas.length || 0,
      totalAreas,
      visitedAreas: progress?.visitedAreas.length || 0,
      collectiblesFound: progress?.collectiblesFound.length || 0,
      npcsInteracted: progress?.npcsInteracted.length || 0,
      currentArea: progress?.currentArea || 'home',
    };
  }
}
