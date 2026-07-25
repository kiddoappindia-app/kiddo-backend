import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { RewardConversion } from '../models/reward-conversion.model.js';
import { PurchaseApproval } from '../models/purchase-approval.model.js';
import { ROLES } from '../constants/roles.js';

interface TransactionWithTimestamps {
  rewardPoints: number;
  redeemCoins: number;
  userId: unknown;
  createdAt: Date;
  actionType: string;
}

export class AnalyticsExtService {
  // ---------------------------------------------------------------------------
  // Parent: weekly/monthly spending per child
  // ---------------------------------------------------------------------------

  static async getChildSpendingAnalytics(familyId: string, period: 'weekly' | 'monthly' = 'weekly') {
    const children = await User.find({ familyId, role: ROLES.CHILD }).select('_id firstName').lean();
    const childIds = children.map(c => c._id);

    const now = new Date();
    const startDate = period === 'weekly'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const transactions = await RewardTransaction.find({
      userId: { $in: childIds },
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 }).lean();

    const childSpending = new Map<string, { earned: number; spent: number; conversions: number; gifts: number }>();

    for (const child of children) {
      childSpending.set(child._id.toString(), { earned: 0, spent: 0, conversions: 0, gifts: 0 });
    }

    for (const txn of transactions) {
      const uid = txn.userId.toString();
      const stats = childSpending.get(uid);
      if (!stats) continue;

      if (txn.rewardPoints > 0 && txn.actionType !== 'gift_received') stats.earned += txn.rewardPoints;
      if (txn.redeemCoins < 0 && txn.actionType === 'purchase') stats.spent += Math.abs(txn.redeemCoins);
      if (txn.actionType === 'conversion_to_coins') stats.conversions += 1;
      if (txn.actionType === 'gift_sent') stats.gifts += 1;
    }

    return {
      period,
      startDate,
      children: children.map(c => ({
        id: c._id,
        name: c.firstName,
        stats: childSpending.get(c._id.toString()) || { earned: 0, spent: 0, conversions: 0, gifts: 0 },
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Parent: wallet growth over time
  // ---------------------------------------------------------------------------

  static async getWalletGrowthAnalytics(childId: string, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({ childId }).lean(),
      RewardTransaction.find({
        userId: childId,
        createdAt: { $gte: startDate },
      }).sort({ createdAt: 1 }).lean() as unknown as TransactionWithTimestamps[],
    ]);

    const dailyBalances: { date: string; rewardPoints: number; redeemCoins: number }[] = [];
    const balanceMap = new Map<string, { rp: number; rc: number }>();

    let runningRP = wallet?.rewardPoints ?? 0;
    let runningRC = wallet?.redeemCoins ?? 0;

    const reversedTxns = [...transactions].reverse();
    for (const txn of reversedTxns) {
      runningRP -= txn.rewardPoints;
      runningRC -= txn.redeemCoins;
      runningRP = Math.max(0, runningRP);
      runningRC = Math.max(0, runningRC);

      const dateKey = new Date(txn.createdAt).toISOString().split('T')[0];
      balanceMap.set(dateKey, { rp: runningRP, rc: runningRC });
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const bal = balanceMap.get(dateKey);
      dailyBalances.push({
        date: dateKey,
        rewardPoints: bal?.rp ?? (i === 0 ? (wallet?.rewardPoints ?? 0) : 0),
        redeemCoins: bal?.rc ?? (i === 0 ? (wallet?.redeemCoins ?? 0) : 0),
      });
    }

    return {
      childId,
      days,
      current: {
        rewardPoints: wallet?.rewardPoints ?? 0,
        redeemCoins: wallet?.redeemCoins ?? 0,
      },
      history: dailyBalances,
    };
  }

  // ---------------------------------------------------------------------------
  // Teacher: top students by earnings
  // ---------------------------------------------------------------------------

  static async getTopStudentsByEarnings(teacherId: string, limit = 10) {
    const teacher = await User.findOne({ teacherId }).select('classId').lean();
    if (!teacher || !teacher.classId) return { students: [] };

    const students = await User.find({ classId: teacher.classId, role: ROLES.CHILD })
      .select('_id firstName lastName points level')
      .lean();

    const studentIds = students.map(s => s._id);

    const earnings = await RewardTransaction.aggregate([
      { $match: { userId: { $in: studentIds }, rewardPoints: { $gt: 0 } } },
      { $group: { _id: '$userId', totalEarned: { $sum: '$rewardPoints' }, count: { $sum: 1 } } },
      { $sort: { totalEarned: -1 } },
      { $limit: limit },
    ]);

    const earningsMap = new Map(earnings.map(e => [e._id.toString(), e]));

    return {
      students: students.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        points: s.points,
        level: s.level,
        totalEarned: earningsMap.get(s._id.toString())?.totalEarned ?? 0,
        transactionCount: earningsMap.get(s._id.toString())?.count ?? 0,
      })).sort((a, b) => b.totalEarned - a.totalEarned),
    };
  }

  // ---------------------------------------------------------------------------
  // Teacher: class activity stats
  // ---------------------------------------------------------------------------

  static async getClassActivityStats(teacherId: string) {
    const teacher = await User.findOne({ teacherId }).select('classId').lean();
    if (!teacher || !teacher.classId) return { stats: {} as any };

    const students = await User.find({ classId: teacher.classId, role: ROLES.CHILD })
      .select('_id')
      .lean();
    const studentIds = students.map(s => s._id);

    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    const [weeklyActivity, transactionSummary] = await Promise.all([
      RewardTransaction.countDocuments({
        userId: { $in: studentIds },
        createdAt: { $gte: weekStart },
      }),
      RewardTransaction.aggregate([
        { $match: { userId: { $in: studentIds } } },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalPointsEarned: { $sum: { $max: ['$rewardPoints', 0] } },
            totalCoinsSpent: { $sum: { $abs: { $min: ['$redeemCoins', 0] } } },
          },
        },
      ]),
    ]);

    return {
      totalStudents: students.length,
      weeklyTransactions: weeklyActivity,
      lifetime: transactionSummary[0] || { totalTransactions: 0, totalPointsEarned: 0, totalCoinsSpent: 0 },
    };
  }

  // ---------------------------------------------------------------------------
  // Admin: platform-wide conversion trends
  // ---------------------------------------------------------------------------

  static async getPlatformConversionTrends(days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dailyConversions = await RewardConversion.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalPointsUsed: { $sum: '$rewardPointsUsed' },
          totalCoinsAwarded: { $sum: '$redeemCoinsAwarded' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = await Wallet.aggregate([
      { $group: { _id: null, totalCoinsSpent: { $sum: '$lifetimeCoinsSpent' } } },
    ]);

    return {
      days,
      daily: dailyConversions,
      totals: {
        totalConversions: dailyConversions.reduce((s, d) => s + d.total, 0),
        totalApproved: dailyConversions.reduce((s, d) => s + d.approved, 0),
        totalRejected: dailyConversions.reduce((s, d) => s + d.rejected, 0),
        totalPointsUsed: dailyConversions.reduce((s, d) => s + d.totalPointsUsed, 0),
        totalCoinsAwarded: dailyConversions.reduce((s, d) => s + d.totalCoinsAwarded, 0),
      },
      economy: {
        totalCoinsSpent: totalRevenue[0]?.totalCoinsSpent ?? 0,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Admin: approval workflow stats
  // ---------------------------------------------------------------------------

  static async getApprovalWorkflowStats() {
    const [purchaseStats, conversionStats] = await Promise.all([
      PurchaseApproval.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      RewardConversion.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      purchaseApprovals: purchaseStats,
      conversionRequests: conversionStats,
    };
  }
}
