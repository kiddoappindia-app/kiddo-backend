import { ROLES } from '../constants/roles.js';
import { ManagementRepository } from '../repositories/management.repository.js';
import { AdminAuditService } from './admin-audit.service.js';
import { ApiError } from '../utils/api-error.js';
import { StatusCodes } from 'http-status-codes';

export class ManagementService {
  // ---------------------------------------------------------------------------
  // Parent: child wallet overview
  // ---------------------------------------------------------------------------

  static async getChildrenWallets(familyId: string) {
    const children = await ManagementRepository.findChildrenByFamily(familyId, ROLES.CHILD);

    const childIds = children.map(c => c._id);
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
  // Teacher: student wallet overview
  // ---------------------------------------------------------------------------

  static async getTeacherStudentWallets(teacherId: string) {
    const teacher = await ManagementRepository.findTeacherClass(teacherId);
    if (!teacher || !teacher.classId) return { students: [], totals: {} as any };

    const classId = teacher.classId;
    const students = await ManagementRepository.findStudentsByClass(classId, ROLES.CHILD);

    if (students.length === 0) return { students: [], totals: { totalStudents: 0 } };

    const studentIds = students.map(s => s._id);
    const wallets = await ManagementRepository.findWallets(studentIds);
    const walletMap = new Map(wallets.map(w => [w.childId.toString(), w]));

    const totalRPEarned = wallets.reduce((sum, w) => sum + w.lifetimeRewardPointsEarned, 0);
    const totalRCSpent = wallets.reduce((sum, w) => sum + w.lifetimeCoinsSpent, 0);

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
  // Approval workflow — generic
  // ---------------------------------------------------------------------------

  static async getFamilyPendingApprovals(familyId: string) {
    const children = await ManagementRepository.findChildrenByFamily(familyId, ROLES.CHILD);
    const childIds = children.map(c => c._id);

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
  // Parent: wallet spending limits
  // ---------------------------------------------------------------------------

  static async setWalletSpendingLimit(childId: string, parentId: string, maxDailySpend: number) {
    const parent = await ManagementRepository.findUserFamily(parentId);
    if (!parent?.familyId) throw new ApiError(StatusCodes.BAD_REQUEST, 'No family associated');

    const child = await ManagementRepository.findChildInFamily(childId, parent.familyId, ROLES.CHILD);
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
}
