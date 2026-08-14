import { AchievementDefinition, ChildAchievement, IAchievementDefinition, IChildAchievement } from '../models/achievement.model.js';
import { WalletEngine } from './wallet-engine.service.js';

export class AchievementEngine {
  static async checkAchievements(childId: string, familyId: string, metrics: Record<string, number>): Promise<IChildAchievement[]> {
    const definitions = await AchievementDefinition.find({ isActive: true });
    const newAchievements: IChildAchievement[] = [];

    for (const def of definitions) {
      const existing = await ChildAchievement.findOne({ childId, achievementId: def._id });
      const currentValue = metrics[def.metricType] || 0;
      const progress = Math.min(100, Math.round((currentValue / def.requiredCount) * 100));

      if (existing) {
        existing.progress = progress;
        await existing.save();
      } else if (currentValue >= def.requiredCount) {
        const achievement = await ChildAchievement.create({
          childId,
          familyId,
          achievementId: def._id,
          unlockedAt: new Date(),
          progress: 100,
          isClaimed: false,
        });

        await WalletEngine.credit(childId, familyId, {
          currency: 'coins',
          amount: def.rewardCoins,
          type: 'achievement',
          description: `Achievement unlocked: ${def.title}`,
          referenceId: def._id.toString(),
          referenceModel: 'AchievementDefinition',
        });

        await WalletEngine.credit(childId, familyId, {
          currency: 'xp',
          amount: def.rewardXp,
          type: 'achievement',
          description: `XP from achievement: ${def.title}`,
          referenceId: def._id.toString(),
          referenceModel: 'AchievementDefinition',
        });

        if (def.rewardStars > 0) {
          await WalletEngine.credit(childId, familyId, {
            currency: 'stars',
            amount: def.rewardStars,
            type: 'achievement',
            description: `Stars from achievement: ${def.title}`,
            referenceId: def._id.toString(),
            referenceModel: 'AchievementDefinition',
          });
        }

        newAchievements.push(achievement);
      }
    }

    return newAchievements;
  }

  static async getChildAchievements(childId: string): Promise<(IChildAchievement & { definition: IAchievementDefinition })[]> {
    return ChildAchievement.find({ childId })
      .populate('achievementId')
      .sort({ unlockedAt: -1 })
      .lean() as any;
  }

  static async getAchievementProgress(childId: string): Promise<(IAchievementDefinition & { currentProgress: number; isUnlocked: boolean })[]> {
    const definitions = await AchievementDefinition.find({ isActive: true }).sort({ sortOrder: 1 });
    const childAchievements = await ChildAchievement.find({ childId });

    const achievementMap = new Map<string, IChildAchievement>();
    childAchievements.forEach(a => achievementMap.set(a.achievementId.toString(), a));

    return definitions.map(def => {
      const childAchievement = achievementMap.get(def._id.toString());
      return {
        ...def.toObject(),
        currentProgress: childAchievement?.progress || 0,
        isUnlocked: !!childAchievement,
      };
    });
  }

  static async claimAchievement(childId: string, achievementId: string): Promise<IChildAchievement> {
    const achievement = await ChildAchievement.findOne({ childId, achievementId });
    if (!achievement) throw new Error('Achievement not found');
    if (achievement.isClaimed) throw new Error('Achievement already claimed');

    achievement.isClaimed = true;
    achievement.claimedAt = new Date();
    await achievement.save();

    return achievement;
  }

  static async getUnclaimedCount(childId: string): Promise<number> {
    return ChildAchievement.countDocuments({ childId, isClaimed: false });
  }

  static async createDefinition(data: Partial<IAchievementDefinition>): Promise<IAchievementDefinition> {
    return AchievementDefinition.create(data);
  }

  static async getDefinitions(category?: string): Promise<IAchievementDefinition[]> {
    const query: any = { isActive: true };
    if (category) query.category = category;
    return AchievementDefinition.find(query).sort({ sortOrder: 1 }).lean();
  }
}
