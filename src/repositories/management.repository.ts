import { User } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { WalletPolicy } from '../models/wallet-policy.model.js';
import { PurchaseApproval } from '../models/purchase-approval.model.js';
import { RewardConversion } from '../models/reward-conversion.model.js';
import { RewardCampaign } from '../models/reward-campaign.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';

export class ManagementRepository {
  static findChildrenByFamily(familyId: string, role: string) {
    return User.find({ familyId, role })
      .select('_id firstName lastName points level xp streak')
      .lean();
  }

  static findUserFamily(userId: string) {
    return User.findById(userId).select('familyId').lean();
  }

  static findTeacherClass(teacherUserId: string) {
    return User.findById(teacherUserId).select('classId').lean();
  }

  static findStudentsByClass(classId: unknown, role: string) {
    return User.find({ classId, role })
      .select('_id firstName lastName points level xp streak')
      .lean();
  }

  static findWallets(childIds: unknown[]) {
    return Wallet.find({ childId: { $in: childIds } }).lean();
  }

  static countPendingConversions(childIds: unknown[]) {
    return RewardConversion.countDocuments({ userId: { $in: childIds }, status: 'pending' });
  }

  static countPendingPurchases(childIds: unknown[]) {
    return PurchaseApproval.countDocuments({ childId: { $in: childIds }, status: 'pending' });
  }

  static findPendingPurchases(childIds: unknown[]) {
    return PurchaseApproval.find({ childId: { $in: childIds }, status: 'pending' })
      .populate('childId', 'firstName lastName')
      .populate('itemId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .lean();
  }

  static findPendingConversions(childIds: unknown[]) {
    return RewardConversion.find({ userId: { $in: childIds }, status: 'pending' })
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

  static findChildInFamily(childId: string, familyId: unknown, role: string) {
    return User.findOne({ _id: childId, familyId, role }).select('_id').lean();
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
}
