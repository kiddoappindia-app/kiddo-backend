import { ROLES } from '../constants/roles.js';
import { ManagementRepository } from '../repositories/management.repository.js';
import { AdminAuditService } from './admin-audit.service.js';
import { NotificationService } from './notification.service.js';
import { RewardService } from './reward.service.js';
import { ApiError } from '../utils/api-error.js';
import { StatusCodes } from 'http-status-codes';
import { Wallet } from '../models/wallet.model.js';
import { User } from '../models/user.model.js';
import { GiftReward } from '../models/gift-reward.model.js';
import { Types } from 'mongoose';

export class ManagementService {
  // ---------------------------------------------------------------------------
  // Parent: child wallet overview
  // ---------------------------------------------------------------------------

  static async getChildrenWallets(familyId: string) {
    const children = await ManagementRepository.findChildrenByFamily(familyId, ROLES.CHILD);

    const childIds = children.map(c => c._id.toString());
    const wallets = await ManagementRepository.findWallets(childIds);
    const walletMap = new Map(wallets.map(w => [w.childId.toString(), w]));

    const [pendingConversions, pendingApprovals] = await Promise.all([
      ManagementRepository.countPendingConversions(childIds),
      ManagementRepository.countPendingPurchases(childIds),
    ]);

    return {
      children: children.map(c => {
        const wallet = walletMap.get(c._id.toString());
        return {
          id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          points: c.points,
          level: c.level,
          xp: c.xp,
          streak: c.streak,
          wallet: wallet
            ? {
                rewardPoints: wallet.rewardPoints,
                redeemCoins: wallet.redeemCoins,
                status: wallet.status,
                currentLevel: wallet.currentLevel,
                experience: wallet.experience,
              }
            : null,
        };
      }),
      totals: {
        totalChildren: children.length,
        pendingConversions,
        pendingApprovals,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Parent: child wallet detail
  // ---------------------------------------------------------------------------

  static async getChildWalletDetail(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    const wallet = await ManagementRepository.findChildWallet(childId);
    const policy = await ManagementRepository.findWalletPolicy(childId);
    const history = await ManagementRepository.getRewardHistoryForChild(childId);

    return { child, wallet, policy, history };
  }

  // ---------------------------------------------------------------------------
  // Parent: reward history / coin history for a child
  // ---------------------------------------------------------------------------

  static async getChildRewardHistory(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getRewardHistoryForChild(childId);
  }

  static async getChildCoinHistory(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getCoinHistoryForChild(childId);
  }

  // ---------------------------------------------------------------------------
  // Parent: approve / reject conversion
  // ---------------------------------------------------------------------------

  static async approveConversion(conversionId: string, parentId: string) {
    return RewardService.approveConversion(conversionId, parentId);
  }

  static async rejectConversion(conversionId: string, parentId: string, reason?: string) {
    return RewardService.rejectConversion(conversionId, parentId, reason);
  }

  // ---------------------------------------------------------------------------
  // Parent: approve / reject purchase
  // ---------------------------------------------------------------------------

  static async approvePurchase(approvalId: string, parentId: string) {
    const { RewardStoreService } = await import('./reward-store.service.js');
    return RewardStoreService.approvePurchase(approvalId, parentId);
  }

  static async rejectPurchase(approvalId: string, parentId: string, reason?: string) {
    const { RewardStoreService } = await import('./reward-store.service.js');
    return RewardStoreService.rejectPurchase(approvalId, parentId, reason);
  }

  // ---------------------------------------------------------------------------
  // Parent: gift reward points / redeem coins
  // ---------------------------------------------------------------------------

  static async giftRewardPoints(childId: string, parentId: string, amount: number, message?: string) {
    return RewardService.giftPoints(parentId, childId, amount, message);
  }

  static async giftRedeemCoins(childId: string, parentId: string, amount: number, message?: string) {
    return RewardService.giftCoins(parentId, childId, amount, message);
  }

  // ---------------------------------------------------------------------------
  // Parent: custom rewards CRUD
  // ---------------------------------------------------------------------------

  static async getCustomRewards(familyId: string, isActive?: boolean) {
    return ManagementRepository.findCustomRewardsByFamily(familyId, isActive);
  }

  static async createCustomReward(familyId: string, actorId: string, data: {
    title: string; description?: string; pointsCost: number; unlockedAtStreak?: number;
  }) {
    const reward = await ManagementRepository.createCustomReward({
      familyId,
      title: data.title,
      description: data.description ?? '',
      pointsCost: data.pointsCost,
      unlockedAtStreak: data.unlockedAtStreak ?? 0,
      isActive: true,
    });

    await ManagementRepository.createActivity({
      familyId,
      actorId: actorId,
      type: 'custom_reward_created',
      message: `Created custom reward "${data.title}"`,
      metadata: { rewardId: reward._id },
    });

    return reward;
  }

  static async updateCustomReward(rewardId: string, familyId: string, actorId: string, data: Record<string, unknown>) {
    const reward = await ManagementRepository.findCustomRewardById(rewardId, familyId);
    if (!reward) throw new ApiError(StatusCodes.NOT_FOUND, 'Custom reward not found');

    const updated = await ManagementRepository.updateCustomReward(rewardId, familyId, data);

    await ManagementRepository.createActivity({
      familyId,
      actorId,
      type: 'custom_reward_updated',
      message: `Updated custom reward "${data.title ?? reward.title}"`,
      metadata: { rewardId },
    });

    return updated;
  }

  static async deleteCustomReward(rewardId: string, familyId: string, actorId: string) {
    const reward = await ManagementRepository.findCustomRewardById(rewardId, familyId);
    if (!reward) throw new ApiError(StatusCodes.NOT_FOUND, 'Custom reward not found');

    await ManagementRepository.deleteCustomReward(rewardId, familyId);

    await ManagementRepository.createActivity({
      familyId,
      actorId,
      type: 'custom_reward_deleted',
      message: `Deleted custom reward "${reward.title}"`,
      metadata: { rewardId },
    });

    return { success: true };
  }

  static async disableCustomReward(rewardId: string, familyId: string, actorId: string) {
    return this.updateCustomReward(rewardId, familyId, actorId, { isActive: false });
  }

  // ---------------------------------------------------------------------------
  // Parent: freeze / unfreeze wallet
  // ---------------------------------------------------------------------------

  static async freezeWallet(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    const result = await RewardService.setWalletStatus(childId, 'frozen');

    await AdminAuditService.record({
      actorId: parentId,
      action: 'wallet.frozen',
      targetType: 'wallet',
      targetId: childId,
    });

    NotificationService.sendToUser(
      childId,
      'Wallet Frozen',
      'Your wallet has been frozen by a parent.',
    ).catch(() => {});

    return result;
  }

  static async unfreezeWallet(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    const result = await RewardService.setWalletStatus(childId, 'active');

    await AdminAuditService.record({
      actorId: parentId,
      action: 'wallet.unfrozen',
      targetType: 'wallet',
      targetId: childId,
    });

    NotificationService.sendToUser(
      childId,
      'Wallet Unfrozen',
      'Your wallet has been unfrozen by a parent.',
    ).catch(() => {});

    return result;
  }

  // ---------------------------------------------------------------------------
  // Parent: configure wallet limits
  // ---------------------------------------------------------------------------

  static async setWalletSpendingLimit(childId: string, parentId: string, maxDailySpend: number) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    const wallet = await ManagementRepository.findWallet(childId);
    if (!wallet) throw new ApiError(StatusCodes.NOT_FOUND, 'Wallet not found');

    const policy = await ManagementRepository.upsertWalletPolicy(childId, parentId, {
      dailySpendingLimit: maxDailySpend,
    });

    await AdminAuditService.record({
      actorId: parentId,
      action: 'wallet.policy.updated',
      targetType: 'wallet',
      targetId: childId,
      metadata: { dailySpendingLimit: maxDailySpend },
    });

    return { childId, policy };
  }

  static async configureWalletPolicy(childId: string, parentId: string, policy: Record<string, number | null>) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    const allowedKeys = [
      'dailySpendingLimit', 'weeklySpendingLimit', 'monthlySpendingLimit',
      'maximumWalletBalance', 'maximumDailyRewardPoints', 'maximumDailyCoinConversion',
    ];

    const sanitized: Record<string, number | null> = {};
    for (const key of allowedKeys) {
      if (policy[key] !== undefined) {
        sanitized[key] = policy[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No valid policy keys provided');
    }

    const updated = await ManagementRepository.upsertWalletPolicy(childId, parentId, sanitized);

    await AdminAuditService.record({
      actorId: parentId,
      action: 'wallet.policy.updated',
      targetType: 'wallet',
      targetId: childId,
      metadata: sanitized,
    });

    return { childId, policy: updated };
  }

  static async getWalletPolicy(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.findWalletPolicy(childId);
  }

  // ---------------------------------------------------------------------------
  // Parent / Teacher / Admin: spending & earning analytics
  // ---------------------------------------------------------------------------

  static async getWeeklyRewardAnalytics(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getWeeklyRewardAnalytics(childId);
  }

  static async getMonthlyRewardAnalytics(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getMonthlyRewardAnalytics(childId);
  }

  static async getSpendingAnalytics(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getSpendingAnalytics(childId);
  }

  static async getWalletGrowthAnalytics(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getWalletGrowthAnalytics(childId);
  }

  // ---------------------------------------------------------------------------
  // Parent: gift history
  // ---------------------------------------------------------------------------

  static async getGiftHistory(childId: string, parentId: string) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId.toString(), ROLES.CHILD);
    if (!child) throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found in your family');

    return ManagementRepository.getGiftHistory(childId);
  }

  // ---------------------------------------------------------------------------
  // Teacher: student wallet overview
  // ---------------------------------------------------------------------------

  static async getTeacherStudentWallets(teacherId: string) {
    const teacher = await ManagementRepository.findTeacherClass(teacherId);
    if (!teacher || !teacher.classId) return { students: [], totals: {} as any };

    const classId = teacher.classId.toString();
    const students = await ManagementRepository.findStudentsByClass(classId, ROLES.CHILD);

    if (students.length === 0) return { students: [], totals: { totalStudents: 0 } };

    const studentIds = students.map(s => s._id.toString());
    const wallets = await ManagementRepository.findWallets(studentIds);
    const walletMap = new Map(wallets.map(w => [w.childId.toString(), w]));

    const totalRPEarned = wallets.reduce((sum: number, w) => sum + w.lifetimeRewardPointsEarned, 0);
    const totalRCSpent = wallets.reduce((sum: number, w) => sum + w.lifetimeCoinsSpent, 0);

    return {
      students: students.map(s => {
        const wallet = walletMap.get(s._id.toString());
        return {
          id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          points: s.points,
          level: s.level,
          xp: s.xp,
          streak: s.streak,
          wallet: wallet
            ? {
                rewardPoints: wallet.rewardPoints,
                redeemCoins: wallet.redeemCoins,
                status: wallet.status,
                lifetimeRewardPointsEarned: wallet.lifetimeRewardPointsEarned,
                lifetimeCoinsSpent: wallet.lifetimeCoinsSpent,
              }
            : null,
        };
      }),
      totals: {
        totalStudents: students.length,
        totalRPEarned,
        totalRCSpent,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Teacher: student reward history & wallet detail
  // ---------------------------------------------------------------------------

  static async getStudentRewardHistory(studentId: string, teacherId: string) {
    const teacher = await ManagementRepository.findTeacherClass(teacherId);
    if (!teacher?.classId) throw new ApiError(StatusCodes.FORBIDDEN, 'Teacher has no class');

    const student = await User.findOne({ _id: studentId, classId: teacher.classId, role: ROLES.CHILD }).lean();
    if (!student) throw new ApiError(StatusCodes.NOT_FOUND, 'Student not found in your class');

    return ManagementRepository.getRewardHistoryForChild(studentId);
  }

  static async getStudentWallet(studentId: string, teacherId: string) {
    const teacher = await ManagementRepository.findTeacherClass(teacherId);
    if (!teacher?.classId) throw new ApiError(StatusCodes.FORBIDDEN, 'Teacher has no class');

    const student = await User.findOne({ _id: studentId, classId: teacher.classId, role: ROLES.CHILD }).lean();
    if (!student) throw new ApiError(StatusCodes.NOT_FOUND, 'Student not found in your class');

    return RewardService.getWallet(studentId);
  }

  // ---------------------------------------------------------------------------
  // Teacher: view leaderboard
  // ---------------------------------------------------------------------------

  static async getClassLeaderboard(teacherId: string) {
    const teacher = await ManagementRepository.findTeacherClass(teacherId);
    if (!teacher?.classId) throw new ApiError(StatusCodes.FORBIDDEN, 'Teacher has no class');

    const { getClassLeaderboard } = await import('./teacher.service.js');
    return getClassLeaderboard(teacher.classId.toString());
  }

  // ---------------------------------------------------------------------------
  // Admin: consolidated platform stats
  // ---------------------------------------------------------------------------

  static async getPlatformEconomyOverview() {
    const [walletStats, totalTransactions, totalConversions, activeCampaigns] = await Promise.all([
      ManagementRepository.getWalletStats(),
      ManagementRepository.countTransactions(),
      ManagementRepository.countApprovedConversions(),
      ManagementRepository.countActiveCampaigns(),
    ]);

    const frozenWallets = await ManagementRepository.countFrozenWallets();

    return {
      wallets: walletStats[0] || {
        totalWallets: 0, totalRPCirculating: 0, totalRCCirculating: 0,
        totalRPEarnedAllTime: 0, totalRCEarnedAllTime: 0, totalRCSpentAllTime: 0,
        avgRP: 0, avgRC: 0,
      },
      frozenWallets,
      totalTransactions,
      totalConversions,
      activeCampaigns,
    };
  }

  // ---------------------------------------------------------------------------
  // Admin: reward rules management
  // ---------------------------------------------------------------------------

  static async listRewardRules() {
    const { RewardRule } = await import('../models/reward-rule.model.js');
    return RewardRule.find().sort({ actionType: 1 }).lean();
  }

  static async getRewardRule(ruleId: string) {
    const { RewardRule } = await import('../models/reward-rule.model.js');
    const rule = await RewardRule.findById(ruleId).lean();
    if (!rule) throw new ApiError(StatusCodes.NOT_FOUND, 'Reward rule not found');
    return rule;
  }

  // ---------------------------------------------------------------------------
  // Admin: settings management
  // ---------------------------------------------------------------------------

  static async getSetting(key: string) {
    return RewardService.getSetting(key, 0);
  }

  static async updateSetting(key: string, value: number | string | boolean, updatedBy: string) {
    const { RewardSettings } = await import('../models/reward-settings.model.js');
    const setting = await RewardSettings.findOneAndUpdate(
      { key },
      { value, updatedBy },
      { new: true, upsert: true },
    ).lean();
    return setting;
  }

  static async listSettings() {
    const { RewardSettings } = await import('../models/reward-settings.model.js');
    return RewardSettings.find().sort({ key: 1 }).lean();
  }

  // ---------------------------------------------------------------------------
  // Admin: manage notifications
  // ---------------------------------------------------------------------------

  static async sendNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    await NotificationService.sendToUser(userId, title, body, data);
    return { success: true };
  }

  static async sendBulkNotification(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    const results = await Promise.allSettled(
      userIds.map(uid => NotificationService.sendToUser(uid, title, body, data)),
    );
    return { sent: results.filter(r => r.status === 'fulfilled').length, total: userIds.length };
  }

  static async sendFamilyNotification(familyId: string, title: string, body: string, data?: Record<string, string>) {
    await NotificationService.sendToFamilyParents(familyId, title, body, data);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Admin: manage rewards (parent/teacher/achievement/login/challenge/streak)
  // ---------------------------------------------------------------------------

  static async listAllRewardRules() {
    const { RewardRule } = await import('../models/reward-rule.model.js');
    return RewardRule.find().sort({ actionType: 1 }).lean();
  }

  static async createRewardRule(data: Record<string, unknown>, adminId: string) {
    const { RewardAdminService } = await import('./reward-admin.service.js');
    return RewardAdminService.createRule({ ...data, adminId } as any);
  }

  static async updateRewardRule(ruleId: string, data: Record<string, unknown>, adminId: string) {
    const { RewardRule } = await import('../models/reward-rule.model.js');
    const rule = await RewardRule.findById(ruleId);
    if (!rule) throw new ApiError(StatusCodes.NOT_FOUND, 'Reward rule not found');
    Object.assign(rule, { ...data, updatedBy: new Types.ObjectId(adminId) });
    return rule.save();
  }

  // ---------------------------------------------------------------------------
  // Approval workflow — generic
  // ---------------------------------------------------------------------------

  static async getFamilyPendingApprovals(familyId: string) {
    const children = await ManagementRepository.findChildrenByFamily(familyId, ROLES.CHILD);
    const childIds = children.map(c => c._id.toString());

    const [purchaseApprovals, conversionRequests] = await Promise.all([
      ManagementRepository.findPendingPurchases(childIds),
      ManagementRepository.findPendingConversions(childIds),
    ]);

    return {
      purchaseApprovals,
      conversionRequests,
      total: purchaseApprovals.length + conversionRequests.length,
    };
  }

  // ---------------------------------------------------------------------------
  // Notification preferences
  // ---------------------------------------------------------------------------

  static async updateNotificationPreferences(userId: string, preferences: Record<string, boolean>) {
    const allowedKeys = [
      'taskAlerts', 'weeklySummary', 'reminderNotifications',
      'quietHours', 'whatsappSummary', 'emailSummary',
      'conversionAlerts', 'purchaseAlerts', 'rewardAlerts',
      'campaignAlerts', 'giftAlerts',
    ];

    const updateData: Record<string, boolean> = {};
    for (const key of allowedKeys) {
      if (preferences[key] !== undefined) {
        updateData[`settings.${key}`] = preferences[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid preference keys provided');
    }

    const user = await ManagementRepository.updateNotificationPreferences(userId, updateData);

    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    return user.settings;
  }

  static async getNotificationPreferences(userId: string) {
    const user = await ManagementRepository.findNotificationPreferences(userId);
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    return {
      settings: user.settings,
      notificationToken: user.notificationToken,
    };
  }

  // ---------------------------------------------------------------------------
  // Admin analytics
  // ---------------------------------------------------------------------------

  static async getPlatformRewardAnalytics() {
    const [economyStats, campaignPerformance, conversionRates, mostPurchasedItems, mostActiveStudents] = await Promise.all([
      RewardService.getEconomyStats(),
      ManagementRepository.getCampaignPerformance(),
      ManagementRepository.getConversionRateAnalytics(),
      ManagementRepository.getMostPurchasedItems(),
      ManagementRepository.getMostActiveStudents(),
    ]);

    return {
      economyStats,
      campaignPerformance,
      conversionRates,
      mostPurchasedItems,
      mostActiveStudents,
    };
  }

  // ---------------------------------------------------------------------------
  // Teacher analytics
  // ---------------------------------------------------------------------------

  static async getTeacherAnalytics(teacherId: string) {
    const teacher = await ManagementRepository.findTeacherClass(teacherId);
    if (!teacher?.classId) return null;

    const classIds = [teacher.classId.toString()];
    const [topStudents, rewardDistribution, studentCount] = await Promise.all([
      ManagementRepository.getTeacherTopStudents(teacherId, classIds),
      ManagementRepository.getRewardDistributionByTeacher(teacherId),
      ManagementRepository.getStudentCountsByClass(teacher.classId.toString()),
    ]);

    return { topStudents, rewardDistribution, studentCount };
  }
}
