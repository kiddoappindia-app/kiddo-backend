import { Types } from 'mongoose';
import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { WalletPolicy } from '../models/wallet-policy.model.js';
import { PurchaseApproval } from '../models/purchase-approval.model.js';
import { RewardConversion } from '../models/reward-conversion.model.js';
import { RewardCampaign } from '../models/reward-campaign.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { Reward } from '../models/reward.model.js';
import { GiftReward } from '../models/gift-reward.model.js';
import { Activity } from '../models/activity.model.js';

type ObjId = Types.ObjectId;

export class ManagementRepository {
  static findChildrenByFamily(familyId: string, role: string) {
    return User.find({ familyId, role } as Record<string, unknown>)
      .select('_id firstName lastName points level xp streak')
      .lean();
  }

  static findUserFamily(userId: string) {
    return User.findById(userId).select('familyId').lean();
  }

  static findTeacherClass(teacherUserId: string) {
    return User.findById(teacherUserId).select('classId').lean();
  }

  static findStudentsByClass(classId: string, role: string) {
    return User.find({ classId: classId as any, role } as Record<string, unknown>)
      .select('_id firstName lastName points level xp streak')
      .lean();
  }

  static findWallets(childIds: string[]) {
    return Wallet.find({ childId: { $in: childIds } } as Record<string, unknown>).lean();
  }

  static countPendingConversions(childIds: string[]) {
    return RewardConversion.countDocuments({ userId: { $in: childIds }, status: 'pending' } as Record<string, unknown>);
  }

  static countPendingPurchases(childIds: string[]) {
    return PurchaseApproval.countDocuments({ childId: { $in: childIds }, status: 'pending' } as Record<string, unknown>);
  }

  static findPendingPurchases(childIds: string[]) {
    return PurchaseApproval.find({ childId: { $in: childIds }, status: 'pending' } as Record<string, unknown>)
      .populate('childId', 'firstName lastName')
      .populate('itemId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .lean();
  }

  static findPendingConversions(childIds: string[]) {
    return RewardConversion.find({ userId: { $in: childIds }, status: 'pending' } as Record<string, unknown>)
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
  }

  static getWalletStats() {
    return Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalWallets: { $sum: 1 },
          totalRPCirculating: { $sum: '$rewardPoints' },
          totalRCCirculating: { $sum: '$redeemCoins' },
          totalRPEarnedAllTime: { $sum: '$lifetimeRewardPointsEarned' },
          totalRCEarnedAllTime: { $sum: '$lifetimeRedeemCoinsEarned' },
          totalRCSpentAllTime: { $sum: '$lifetimeCoinsSpent' },
          avgRP: { $avg: '$rewardPoints' },
          avgRC: { $avg: '$redeemCoins' },
        },
      },
    ]);
  }

  static countTransactions() { return RewardTransaction.countDocuments(); }
  static countApprovedConversions() { return RewardConversion.countDocuments({ status: 'approved' }); }
  static countActiveCampaigns() { return RewardCampaign.countDocuments({ isActive: true }); }
  static countFrozenWallets() { return Wallet.countDocuments({ status: 'frozen' }); }

  static updateNotificationPreferences(userId: string, updateData: Record<string, boolean>) {
    return User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, select: 'settings' }).lean();
  }

  static findNotificationPreferences(userId: string) {
    return User.findById(userId).select('settings notificationToken').lean();
  }

  static findChildInFamily(childId: string, familyId: string, role: string) {
    return User.findOne({ _id: childId, familyId, role } as Record<string, unknown>).select('_id').lean();
  }

  static findWallet(childId: string) {
    return Wallet.findOne({ childId }).lean();
  }

  static upsertWalletPolicy(
    childId: string,
    updatedBy: string,
    policy: Record<string, number | null>,
  ) {
    return WalletPolicy.findOneAndUpdate(
      { childId },
      { $set: { ...policy, updatedBy } },
      { new: true, upsert: true, runValidators: true },
    ).lean();
  }

  static findChildWallet(childId: string) {
    return Wallet.findOne({ childId }).lean();
  }

  static findChildrenInFamily(familyId: string) {
    return User.find({ familyId, role: 'child' }).select('_id firstName lastName').lean();
  }

  static findParentOfChild(childId: string) {
    return User.findById(childId).select('parentId familyId').lean();
  }

  static findCustomRewardsByFamily(familyId: string, isActive?: boolean) {
    const filter: Record<string, unknown> = { familyId };
    if (isActive !== undefined) filter.isActive = isActive;
    return Reward.find(filter).sort({ pointsCost: 1 }).lean();
  }

  static findCustomRewardById(rewardId: string, familyId: string) {
    return Reward.findOne({ _id: rewardId as any, familyId } as Record<string, unknown>).lean();
  }

  static createCustomReward(data: Record<string, unknown>) {
    return Reward.create(data);
  }

  static updateCustomReward(rewardId: string, familyId: string, data: Record<string, unknown>) {
    return Reward.findOneAndUpdate(
      { _id: rewardId as any, familyId } as Record<string, unknown>,
      { $set: data },
      { new: true },
    ).lean();
  }

  static deleteCustomReward(rewardId: string, familyId: string) {
    return Reward.findOneAndDelete({ _id: rewardId as any, familyId } as Record<string, unknown>).lean();
  }

  static findWalletPolicy(childId: string) {
    return WalletPolicy.findOne({ childId }).lean();
  }

  static getRewardHistoryForChild(childId: string, limit = 50) {
    return RewardTransaction.find({ userId: childId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static getCoinHistoryForChild(childId: string, limit = 50) {
    return RewardTransaction.find({
      userId: childId,
      $or: [
        { redeemCoins: { $ne: 0 } },
        { actionType: 'conversion_to_coins' },
        { actionType: 'purchase' },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static getWeeklyRewardAnalytics(childId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return RewardTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(childId), createdAt: { $gte: weekAgo } } as Record<string, unknown> },
      {
        $group: {
          _id: null,
          totalRPEarned: { $sum: { $max: ['$rewardPoints', 0] } },
          totalRPSpent: { $sum: { $min: ['$rewardPoints', 0] } },
          totalCoinsEarned: { $sum: { $max: ['$redeemCoins', 0] } },
          totalCoinsSpent: { $sum: { $min: ['$redeemCoins', 0] } },
          transactionCount: { $sum: 1 },
        },
      },
    ]);
  }

  static getMonthlyRewardAnalytics(childId: string) {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return RewardTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(childId), createdAt: { $gte: monthAgo } } as Record<string, unknown> },
      {
        $group: {
          _id: null,
          totalRPEarned: { $sum: { $max: ['$rewardPoints', 0] } },
          totalRPSpent: { $sum: { $min: ['$rewardPoints', 0] } },
          totalCoinsEarned: { $sum: { $max: ['$redeemCoins', 0] } },
          totalCoinsSpent: { $sum: { $min: ['$redeemCoins', 0] } },
          transactionCount: { $sum: 1 },
        },
      },
    ]);
  }

  static getSpendingAnalytics(childId: string) {
    return RewardTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(childId), actionType: { $in: ['purchase', 'refund'] } } as Record<string, unknown> },
      {
        $group: {
          _id: '$actionType',
          total: { $sum: { $abs: '$redeemCoins' } },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  static getWalletGrowthAnalytics(childId: string) {
    return RewardTransaction.find({ userId: childId })
      .select('rewardPoints redeemCoins createdAt')
      .sort({ createdAt: 1 })
      .lean();
  }

  static getStudentCountsByClass(classId: string) {
    return User.countDocuments({ classId, role: 'child' });
  }

  static getTeacherTopStudents(teacherId: string, classIds: string[], limit = 10) {
    return User.find({ classId: { $in: classIds }, role: 'child' })
      .select('firstName lastName points xp level streak avatar')
      .sort({ points: -1 })
      .limit(limit)
      .lean();
  }

  static getRewardDistributionByTeacher(teacherId: string) {
    return RewardTransaction.aggregate([
      { $match: { source: 'teacher', createdBy: new Types.ObjectId(teacherId), rewardPoints: { $gt: 0 } } as Record<string, unknown> },
      {
        $group: {
          _id: '$actionType',
          total: { $sum: '$rewardPoints' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);
  }

  static getCampaignPerformance() {
    return RewardCampaign.aggregate([
      {
        $lookup: {
          from: 'rewardtransactions',
          localField: '_id',
          foreignField: 'metadata.campaignId',
          as: 'transactions',
        },
      },
      {
        $project: {
          name: 1,
          type: 1,
          startDate: 1,
          endDate: 1,
          isActive: 1,
          bonusPointsMultiplier: 1,
          transactionCount: { $size: '$transactions' },
          totalPointsAwarded: { $sum: '$transactions.rewardPoints' },
        },
      },
      { $sort: { startDate: -1 } },
    ]);
  }

  static getConversionRateAnalytics() {
    return RewardConversion.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPoints: { $sum: '$rewardPointsUsed' },
          totalCoins: { $sum: '$redeemCoinsAwarded' },
        },
      },
    ]);
  }

  static getMostPurchasedItems(limit = 10) {
    return RewardTransaction.aggregate([
      { $match: { actionType: 'purchase' } },
      {
        $group: {
          _id: '$metadata.itemName',
          count: { $sum: 1 },
          totalCoins: { $sum: { $abs: '$redeemCoins' } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  }

  static getMostActiveStudents(limit = 10) {
    return RewardTransaction.aggregate([
      {
        $group: {
          _id: '$userId',
          transactionCount: { $sum: 1 },
          totalRPEarned: { $sum: { $max: ['$rewardPoints', 0] } },
          totalCoinsSpent: { $sum: { $abs: { $min: ['$redeemCoins', 0] } } },
        },
      },
      { $sort: { transactionCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          transactionCount: 1,
          totalRPEarned: 1,
          totalCoinsSpent: 1,
          firstName: '$user.firstName',
          lastName: '$user.lastName',
        },
      },
    ]);
  }

  static getGiftHistory(childId: string) {
    return GiftReward.find({
      $or: [{ senderId: childId as any }, { receiverId: childId as any }],
    } as Record<string, unknown>)
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
  }

  static findGiftById(giftId: string) {
    return GiftReward.findById(giftId).lean();
  }

  static createActivity(data: Record<string, unknown>) {
    return Activity.create(data);
  }
}


