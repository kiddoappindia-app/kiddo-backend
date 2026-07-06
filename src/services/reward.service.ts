import mongoose, { Types } from 'mongoose';
import { Wallet } from '../models/wallet.model.js';
import { RewardRule, IRewardRule } from '../models/reward-rule.model.js';
import { RewardEvent } from '../models/reward-event.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { RewardConversion } from '../models/reward-conversion.model.js';
import { RewardCampaign } from '../models/reward-campaign.model.js';
import { RewardSettings } from '../models/reward-settings.model.js';
import { GiftReward } from '../models/gift-reward.model.js';
import { Reward } from '../models/reward.model.js';
import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { ApiError } from '../utils/api-error.js';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service.js';
import { ROLES } from '../constants/roles.js';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_CONVERSION_RATIO,
  DEFAULT_MIN_CONVERSION_POINTS,
  DEFAULT_XP_NEEDED_MULTIPLIER,
} from '../constants/reward-economy.js';

export class RewardService {
  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  static async getSetting(key: string, defaultValue: number): Promise<number> {
    try {
      const setting = await RewardSettings.findOne({ key }).lean();
      if (setting) return Number(setting.value);
    } catch {
      // ignore
    }
    return defaultValue;
  }

  private static async getConversionRatio(): Promise<number> {
    return RewardService.getSetting('conversion_ratio', DEFAULT_CONVERSION_RATIO);
  }

  private static async getMinConversionPoints(): Promise<number> {
    return RewardService.getSetting('min_conversion_points', DEFAULT_MIN_CONVERSION_POINTS);
  }

  // ---------------------------------------------------------------------------
  // Wallet helpers
  // ---------------------------------------------------------------------------

  static async getOrCreateWallet(childId: string): Promise<InstanceType<typeof Wallet>> {
    let wallet = await Wallet.findOne({ childId });
    if (!wallet) {
      wallet = await Wallet.create({ childId });
    }
    return wallet;
  }

  static async getWallet(childId: string) {
    const wallet = await RewardService.getOrCreateWallet(childId);
    const user = await User.findById(childId).select('xp level streak').lean();

    return {
      ...wallet.toObject(),
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      streak: user?.streak ?? 0,
    };
  }

  static async validateWalletNotFrozen(wallet: { status: string }): Promise<void> {
    if (wallet.status !== 'active') {
      throw new Error(`Wallet is ${wallet.status}. Contact a parent or admin.`);
    }
  }

  // ---------------------------------------------------------------------------
  // Rule enforcement
  // ---------------------------------------------------------------------------

  static async enforceRule(
    action: string,
    childId: string,
    age?: number,
  ): Promise<IRewardRule> {
    const rule = await RewardRule.findOne({ actionType: action, isActive: true });
    if (!rule) {
      throw new Error(`No active reward rule found for action: ${action}`);
    }

    if (rule.minimumAge > 0 && age !== undefined && age < rule.minimumAge) {
      throw new Error(`Child must be at least ${rule.minimumAge} years old for ${rule.name}`);
    }
    if (rule.maximumAge > 0 && age !== undefined && age > rule.maximumAge) {
      throw new Error(`Child must be at most ${rule.maximumAge} years old for ${rule.name}`);
    }

    if (rule.cooldown > 0) {
      const lastEvent = await RewardEvent.findOne({
        childId: new Types.ObjectId(childId),
        action,
      }).sort({ createdAt: -1 }).lean();

      if (lastEvent) {
        const elapsed = Date.now() - new Date(lastEvent.createdAt).getTime();
        if (elapsed < rule.cooldown * 1000) {
          const remaining = Math.ceil((rule.cooldown * 1000 - elapsed) / 1000);
          throw new Error(`Please wait ${remaining}s before next ${rule.name}`);
        }
      }
    }

    if (rule.maxPerDay > 0 || rule.maxPerWeek > 0 || rule.maxPerMonth > 0) {
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(dayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const match: Record<string, unknown> = {
        childId: new Types.ObjectId(childId),
        action,
      };

      const [daily, weekly, monthly] = await Promise.all([
        rule.maxPerDay > 0
          ? RewardEvent.countDocuments({ ...match, createdAt: { $gte: dayStart } })
          : Promise.resolve(0),
        rule.maxPerWeek > 0
          ? RewardEvent.countDocuments({ ...match, createdAt: { $gte: weekStart } })
          : Promise.resolve(0),
        rule.maxPerMonth > 0
          ? RewardEvent.countDocuments({ ...match, createdAt: { $gte: monthStart } })
          : Promise.resolve(0),
      ]);

      if (rule.maxPerDay > 0 && daily >= rule.maxPerDay) {
        throw new Error(`Daily limit reached for ${rule.name} (${rule.maxPerDay})`);
      }
      if (rule.maxPerWeek > 0 && weekly >= rule.maxPerWeek) {
        throw new Error(`Weekly limit reached for ${rule.name} (${rule.maxPerWeek})`);
      }
      if (rule.maxPerMonth > 0 && monthly >= rule.maxPerMonth) {
        throw new Error(`Monthly limit reached for ${rule.name} (${rule.maxPerMonth})`);
      }
    }

    return rule;
  }

  // ---------------------------------------------------------------------------
  // Duplicate prevention
  // ---------------------------------------------------------------------------

  static async checkDuplicate(source: string, sourceId: string): Promise<boolean> {
    if (!sourceId) return false;
    const existing = await RewardEvent.findOne({ source, sourceId }).lean();
    return !!existing;
  }

  // ---------------------------------------------------------------------------
  // Campaign multiplier
  // ---------------------------------------------------------------------------

  static async getActiveMultiplier(action: string): Promise<number> {
    const now = new Date();
    const campaign = await RewardCampaign.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ bonusPointsMultiplier: -1 }).lean();

    if (campaign) {
      const appliesToAll = !campaign.name;
      const appliesToAction = false;
      if (appliesToAll || appliesToAction) {
        return campaign.bonusPointsMultiplier;
      }
    }
    return 1.0;
  }

  // ---------------------------------------------------------------------------
  // TRANSACTION-BASED: Award Reward Points
  // ---------------------------------------------------------------------------

  static async awardPoints(
    childId: string,
    action: string,
    points?: number,
    source: string = 'system',
    sourceId?: string,
    description?: string,
    createdBy?: string,
    age?: number,
  ): Promise<{
    transaction: Record<string, unknown>;
    wallet: Record<string, unknown>;
    rule: IRewardRule;
    event: Record<string, unknown>;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (sourceId) {
        const isDuplicate = await RewardService.checkDuplicate(source, sourceId);
        if (isDuplicate) {
          throw new Error(`Duplicate reward: ${source}:${sourceId} already processed`);
        }
      }

      const rule = await RewardService.enforceRule(action, childId, age);
      const pointsToAward = points ?? rule.basePoints;
      if (pointsToAward <= 0) {
        throw new Error('Points must be positive');
      }

      const multiplier = await RewardService.getActiveMultiplier(action);
      const totalPoints = Math.round(pointsToAward * multiplier);

      const wallet = await Wallet.findOne({ childId }).session(session);
      if (!wallet) {
        throw new Error('Wallet not found. Create a wallet first.');
      }
      await RewardService.validateWalletNotFrozen(wallet);

      const user = await User.findById(childId).session(session);
      if (!user) throw new Error('User not found');

      const balanceBefore = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      wallet.rewardPoints += totalPoints;
      wallet.lifetimeRewardPointsEarned += totalPoints;

      user.points = (user.points ?? 0) + totalPoints;
      user.xp = (user.xp ?? 0) + totalPoints;

      let xpNeeded = (user.level ?? 1) * (user.level ?? 1) * DEFAULT_XP_NEEDED_MULTIPLIER;
      while ((user.xp ?? 0) >= xpNeeded) {
        user.level = (user.level ?? 1) + 1;
        wallet.currentLevel = user.level;
        xpNeeded = user.level * user.level * DEFAULT_XP_NEEDED_MULTIPLIER;
      }
      wallet.experience = user.xp ?? 0;

      const balanceAfter = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      const event = await RewardEvent.create([{
        childId: new Types.ObjectId(childId),
        action,
        points: pointsToAward,
        ruleId: rule._id,
        source,
        sourceId: sourceId ?? null,
        multiplier,
        totalPoints,
      }], { session });

      const transaction = await RewardTransaction.create([{
        userId: new Types.ObjectId(childId),
        walletId: wallet._id,
        actionType: action,
        rewardPoints: totalPoints,
        redeemCoins: 0,
        balanceBefore,
        balanceAfter,
        description: description ?? `${totalPoints} RP earned for ${rule.name}`,
        referenceId: sourceId ? new Types.ObjectId(sourceId) : null,
        referenceType: source,
        createdBy: createdBy ? new Types.ObjectId(createdBy) : new Types.ObjectId(childId),
        source: 'system',
        metadata: { action, rule: rule.name, multiplier, basePoints: pointsToAward },
      }], { session });

      await wallet.save({ session });
      await user.save({ session });
      await session.commitTransaction();

      const txn = transaction[0].toObject();
      const walletObj = await RewardService.getWallet(childId);
      const eventObj = event[0].toObject();

      NotificationService.sendToUser(
        childId,
        'Points Earned!',
        `You earned ${totalPoints} points for ${rule.name}!`,
      ).catch(() => {});

      return { transaction: txn as unknown as Record<string, unknown>, wallet: walletObj as unknown as Record<string, unknown>, rule, event: eventObj as unknown as Record<string, unknown> };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Remove Points (admin reversal/correction)
  // ---------------------------------------------------------------------------

  static async removePoints(
    childId: string,
    points: number,
    reason: string,
    adminId: string,
  ): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (points <= 0) throw new Error('Points to remove must be positive');

      const wallet = await Wallet.findOne({ childId }).session(session);
      if (!wallet) throw new Error('Wallet not found');
      await RewardService.validateWalletNotFrozen(wallet);

      const user = await User.findById(childId).session(session);
      if (!user) throw new Error('User not found');

      const actualRemoval = Math.min(points, wallet.rewardPoints);
      const balanceBefore = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      wallet.rewardPoints -= actualRemoval;
      user.points = Math.max(0, (user.points ?? 0) - actualRemoval);

      const balanceAfter = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      const transaction = await RewardTransaction.create([{
        userId: new Types.ObjectId(childId),
        walletId: wallet._id,
        actionType: 'admin_adjustment',
        rewardPoints: -actualRemoval,
        redeemCoins: 0,
        balanceBefore,
        balanceAfter,
        description: reason,
        createdBy: new Types.ObjectId(adminId),
        source: 'admin',
        metadata: { reason },
      }], { session });

      await wallet.save({ session });
      await user.save({ session });
      await session.commitTransaction();

      return {
        pointsRemoved: actualRemoval,
        rewardPoints: wallet.rewardPoints,
        transaction: transaction[0].toObject(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Convert RP to RC
  // ---------------------------------------------------------------------------

  static async convertPoints(
    childId: string,
    pointsToConvert: number,
  ): Promise<Record<string, unknown>> {
    const ratio = await RewardService.getConversionRatio();
    const minPoints = await RewardService.getMinConversionPoints();

    if (pointsToConvert < minPoints) {
      throw new Error(`Minimum conversion is ${minPoints} Reward Points`);
    }
    if (pointsToConvert % minPoints !== 0) {
      throw new Error(`Points must be in multiples of ${minPoints}`);
    }

    const wallet = await Wallet.findOne({ childId });
    if (!wallet) throw new Error('Wallet not found');
    await RewardService.validateWalletNotFrozen(wallet);

    if (wallet.rewardPoints < pointsToConvert) {
      throw new Error('Insufficient Reward Points');
    }

    const coinsAwarded = Math.floor(pointsToConvert / ratio);
    if (coinsAwarded < 1) {
      throw new Error(`Need at least ${ratio} points for 1 coin`);
    }

    const rule = await RewardRule.findOne({ actionType: 'conversion_to_coins' });
    if (rule?.isActive) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      if (wallet.lastConversionDate && wallet.lastConversionDate < todayStart) {
        wallet.dailyConversionUsed = 0;
      }
      if (wallet.lastConversionDate && wallet.lastConversionDate < weekStart) {
        wallet.weeklyConversionUsed = 0;
      }
      if (wallet.lastConversionDate && wallet.lastConversionDate < monthStart) {
        wallet.monthlyConversionUsed = 0;
      }

      const conversionsCount = Math.floor(pointsToConvert / minPoints);

      if (rule.maxPerDay > 0 && wallet.dailyConversionUsed + conversionsCount > rule.maxPerDay) {
        throw new Error(`Daily conversion limit exceeded (max ${rule.maxPerDay})`);
      }
      if (rule.maxPerWeek > 0 && wallet.weeklyConversionUsed + conversionsCount > rule.maxPerWeek) {
        throw new Error(`Weekly conversion limit exceeded (max ${rule.maxPerWeek})`);
      }
      if (rule.maxPerMonth > 0 && wallet.monthlyConversionUsed + conversionsCount > rule.maxPerMonth) {
        throw new Error(`Monthly conversion limit exceeded (max ${rule.maxPerMonth})`);
      }

      wallet.dailyConversionUsed += conversionsCount;
      wallet.weeklyConversionUsed += conversionsCount;
      wallet.monthlyConversionUsed += conversionsCount;
    }

    const user = await User.findById(childId);
    if (!user) throw new Error('User not found');

    const balanceBefore = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    wallet.rewardPoints -= pointsToConvert;
    wallet.redeemCoins += coinsAwarded;
    wallet.lifetimeRedeemCoinsEarned += coinsAwarded;
    wallet.totalConversions += 1;
    wallet.pointsConverted += pointsToConvert;
    wallet.lastConversionDate = new Date();

    user.points = Math.max(0, (user.points ?? 0) - pointsToConvert);

    const conversion = await RewardConversion.create({
      userId: new Types.ObjectId(childId),
      walletId: wallet._id,
      rewardPointsUsed: pointsToConvert,
      redeemCoinsAwarded: coinsAwarded,
      conversionRatio: ratio,
      status: 'approved',
      parentApprovalRequired: false,
    });

    const balanceAfter = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    await RewardTransaction.create({
      userId: new Types.ObjectId(childId),
      walletId: wallet._id,
      actionType: 'conversion_to_coins',
      rewardPoints: -pointsToConvert,
      redeemCoins: coinsAwarded,
      balanceBefore,
      balanceAfter,
      description: `Converted ${pointsToConvert} RP to ${coinsAwarded} RC`,
      referenceId: conversion._id,
      referenceType: 'RewardConversion',
      createdBy: new Types.ObjectId(childId),
      source: 'child',
      metadata: { conversionRatio: ratio },
    });

    await wallet.save();
    await user.save();

    NotificationService.sendToUser(
      childId,
      'Coins Earned!',
      `You earned ${coinsAwarded} Redeem Coins!`,
    ).catch(() => {});

    return {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
      coinsAwarded,
      conversionId: conversion._id,
    };
  }

  // ---------------------------------------------------------------------------
  // Conversion Request (parent approval flow)
  // ---------------------------------------------------------------------------

  static async requestConversion(
    childId: string,
    pointsToConvert: number,
    parentId: string,
  ) {
    const ratio = await RewardService.getConversionRatio();
    const minPoints = await RewardService.getMinConversionPoints();

    if (pointsToConvert < minPoints) {
      throw new Error(`Minimum conversion is ${minPoints} Reward Points`);
    }
    if (pointsToConvert % minPoints !== 0) {
      throw new Error(`Points must be in multiples of ${minPoints}`);
    }

    const wallet = await Wallet.findOne({ childId });
    if (!wallet) throw new Error('Wallet not found');
    await RewardService.validateWalletNotFrozen(wallet);

    if (wallet.rewardPoints < pointsToConvert) {
      throw new Error('Insufficient Reward Points');
    }

    const user = await User.findById(childId);
    if (!user) throw new Error('User not found');

    const coinsAwarded = Math.floor(pointsToConvert / ratio);

    wallet.rewardPoints -= pointsToConvert;
    wallet.pendingConversions += 1;
    user.points = Math.max(0, (user.points ?? 0) - pointsToConvert);

    const conversion = await RewardConversion.create({
      userId: new Types.ObjectId(childId),
      walletId: wallet._id,
      rewardPointsUsed: pointsToConvert,
      redeemCoinsAwarded: coinsAwarded,
      conversionRatio: ratio,
      status: 'pending',
      parentApprovalRequired: true,
    });

    await wallet.save();
    await user.save();

    NotificationService.sendToUser(
      parentId,
      'Conversion Request',
      `${user.firstName} wants to convert ${pointsToConvert} RP to ${coinsAwarded} RC`,
    ).catch(() => {});

    return {
      conversionId: conversion._id,
      status: 'pending',
      rewardPoints: wallet.rewardPoints,
      coinsPending: coinsAwarded,
    };
  }

  // ---------------------------------------------------------------------------
  // Approve / Reject Conversion
  // ---------------------------------------------------------------------------

  static async approveConversion(conversionId: string, parentId: string) {
    const conversion = await RewardConversion.findById(conversionId);
    if (!conversion) throw new Error('Conversion not found');
    if (conversion.status !== 'pending') throw new Error('Conversion is not pending');

    const wallet = await Wallet.findById(conversion.walletId);
    if (!wallet) throw new Error('Wallet not found');

    conversion.status = 'approved';
    conversion.approvedBy = new Types.ObjectId(parentId);
    conversion.approvedAt = new Date();

    wallet.redeemCoins += conversion.redeemCoinsAwarded;
    wallet.lifetimeRedeemCoinsEarned += conversion.redeemCoinsAwarded;
    wallet.totalConversions += 1;
    wallet.pendingConversions = Math.max(0, wallet.pendingConversions - 1);

    const balanceBefore = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins - conversion.redeemCoinsAwarded,
    };
    const balanceAfter = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    await conversion.save();
    await wallet.save();

    await RewardTransaction.create({
      userId: conversion.userId,
      walletId: wallet._id,
      actionType: 'conversion_to_coins',
      rewardPoints: 0,
      redeemCoins: conversion.redeemCoinsAwarded,
      balanceBefore,
      balanceAfter,
      description: `Conversion approved: ${conversion.rewardPointsUsed} RP → ${conversion.redeemCoinsAwarded} RC`,
      referenceId: conversion._id,
      referenceType: 'RewardConversion',
      createdBy: new Types.ObjectId(parentId),
      source: 'parent',
      metadata: { conversionRatio: conversion.conversionRatio },
    });

    NotificationService.sendToUser(
      conversion.userId.toString(),
      'Conversion Approved!',
      `Your conversion of ${conversion.rewardPointsUsed} RP to ${conversion.redeemCoinsAwarded} RC was approved!`,
    ).catch(() => {});

    return { status: 'approved', redeemCoins: wallet.redeemCoins };
  }

  static async rejectConversion(conversionId: string, parentId: string, reason?: string) {
    const conversion = await RewardConversion.findById(conversionId);
    if (!conversion) throw new Error('Conversion not found');
    if (conversion.status !== 'pending') throw new Error('Conversion is not pending');

    const wallet = await Wallet.findById(conversion.walletId);
    if (!wallet) throw new Error('Wallet not found');

    conversion.status = 'rejected';
    conversion.rejectedAt = new Date();
    conversion.rejectionReason = reason ?? '';

    wallet.rewardPoints += conversion.rewardPointsUsed;
    wallet.pendingConversions = Math.max(0, wallet.pendingConversions - 1);

    const user = await User.findById(conversion.userId);
    if (user) {
      user.points = (user.points ?? 0) + conversion.rewardPointsUsed;
      await user.save();
    }

    await conversion.save();
    await wallet.save();

    NotificationService.sendToUser(
      conversion.userId.toString(),
      'Conversion Rejected',
      reason
        ? `Your conversion was rejected: ${reason}`
        : 'Your conversion request was rejected by a parent',
    ).catch(() => {});

    return { status: 'rejected', rewardPoints: wallet.rewardPoints };
  }

  // ---------------------------------------------------------------------------
  // Spend Redeem Coins
  // ---------------------------------------------------------------------------

  static async spendCoins(
    childId: string,
    coins: number,
    referenceType?: string,
    referenceId?: string,
    description?: string,
    createdBy?: string,
  ): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (coins <= 0) throw new Error('Coins to spend must be positive');

      const wallet = await Wallet.findOne({ childId }).session(session);
      if (!wallet) throw new Error('Wallet not found');
      await RewardService.validateWalletNotFrozen(wallet);

      if (wallet.redeemCoins < coins) {
        throw new Error('Insufficient Redeem Coins');
      }

      const balanceBefore = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      wallet.redeemCoins -= coins;
      wallet.lifetimeCoinsSpent += coins;

      const balanceAfter = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      const transaction = await RewardTransaction.create([{
        userId: new Types.ObjectId(childId),
        walletId: wallet._id,
        actionType: 'purchase',
        rewardPoints: 0,
        redeemCoins: -coins,
        balanceBefore,
        balanceAfter,
        description: description ?? `Spent ${coins} RC`,
        referenceId: referenceId ? new Types.ObjectId(referenceId) : null,
        referenceType: referenceType ?? null,
        createdBy: createdBy ? new Types.ObjectId(createdBy) : new Types.ObjectId(childId),
        source: 'child',
        metadata: { coinsSpent: coins },
      }], { session });

      await wallet.save({ session });
      await session.commitTransaction();

      return {
        redeemCoins: wallet.redeemCoins,
        coinsSpent: coins,
        transaction: transaction[0].toObject(),
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Refund Redeem Coins
  // ---------------------------------------------------------------------------

  static async refundCoins(
    childId: string,
    coins: number,
    referenceType?: string,
    referenceId?: string,
    description?: string,
    createdBy?: string,
  ): Promise<Record<string, unknown>> {
    if (coins <= 0) throw new Error('Coins to refund must be positive');

    const wallet = await Wallet.findOne({ childId });
    if (!wallet) throw new Error('Wallet not found');
    await RewardService.validateWalletNotFrozen(wallet);

    const balanceBefore = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    wallet.redeemCoins += coins;

    const balanceAfter = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    const transaction = await RewardTransaction.create({
      userId: new Types.ObjectId(childId),
      walletId: wallet._id,
      actionType: 'refund',
      rewardPoints: 0,
      redeemCoins: coins,
      balanceBefore,
      balanceAfter,
      description: description ?? `Refunded ${coins} RC`,
      referenceId: referenceId ? new Types.ObjectId(referenceId) : null,
      referenceType: referenceType ?? null,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : new Types.ObjectId(childId),
      source: 'system',
      metadata: { coinsRefunded: coins },
    });

    await wallet.save();

    return {
      redeemCoins: wallet.redeemCoins,
      coinsRefunded: coins,
      transaction: transaction.toObject(),
    };
  }

  // ---------------------------------------------------------------------------
  // Gift Points
  // ---------------------------------------------------------------------------

  static async giftPoints(
    senderId: string,
    receiverId: string,
    amount: number,
    message?: string,
  ): Promise<Record<string, unknown>> {
    if (amount <= 0) throw new Error('Amount must be positive');

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender) throw new Error('Sender not found');
    if (!receiver) throw new Error('Receiver not found');

    const senderWallet = await Wallet.findOne({ childId: senderId });
    const receiverWallet = await RewardService.getOrCreateWallet(receiverId);

    await RewardService.validateWalletNotFrozen(receiverWallet);
      if (sender.role !== ROLES.ADMIN) {
      if (!senderWallet || senderWallet.rewardPoints < amount) {
        throw new Error('Insufficient Reward Points');
      }
    }

    if (sender.role !== ROLES.ADMIN && senderWallet) {
      senderWallet.rewardPoints -= amount;
    }
    receiverWallet.rewardPoints += amount;

    const senderBalBefore = {
      rewardPoints: (senderWallet?.rewardPoints ?? 0) + (sender.role !== 'admin' ? amount : 0),
      redeemCoins: senderWallet?.redeemCoins ?? 0,
    };
    const senderBalAfter = {
      rewardPoints: senderWallet?.rewardPoints ?? 0,
      redeemCoins: senderWallet?.redeemCoins ?? 0,
    };
    const receiverBalBefore = {
      rewardPoints: receiverWallet.rewardPoints - amount,
      redeemCoins: receiverWallet.redeemCoins,
    };
    const receiverBalAfter = {
      rewardPoints: receiverWallet.rewardPoints,
      redeemCoins: receiverWallet.redeemCoins,
    };

    const gift = await GiftReward.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      type: 'reward_points',
      amount,
      message: message ?? '',
      status: 'sent',
    });

    const operations: Promise<unknown>[] = [];

    if (sender.role !== 'admin' && senderWallet) {
      sender.points = Math.max(0, (sender.points ?? 0) - amount);
      operations.push(sender.save());
      operations.push(senderWallet.save());
    }

    receiver.points = (receiver.points ?? 0) + amount;
    operations.push(receiver.save());
    operations.push(receiverWallet.save());

      const source: 'parent' | 'teacher' | 'admin' =
        sender.role === ROLES.TEACHER ? 'teacher' : sender.role === ROLES.ADMIN ? 'admin' : 'parent';

    operations.push(
      RewardTransaction.create({
        userId: new Types.ObjectId(senderId),
        walletId: (senderWallet ?? receiverWallet)._id,
        actionType: 'gift_sent',
        rewardPoints: -amount,
        redeemCoins: 0,
        balanceBefore: senderBalBefore,
        balanceAfter: senderBalAfter,
        description: `Gifted ${amount} RP to ${receiver.firstName}`,
        referenceId: gift._id,
        referenceType: 'GiftReward',
        createdBy: new Types.ObjectId(senderId),
        source,
        metadata: { receiverName: receiver.firstName },
      }),
      RewardTransaction.create({
        userId: new Types.ObjectId(receiverId),
        walletId: receiverWallet._id,
        actionType: 'gift_received',
        rewardPoints: amount,
        redeemCoins: 0,
        balanceBefore: receiverBalBefore,
        balanceAfter: receiverBalAfter,
        description: `Received ${amount} RP from ${sender.firstName}`,
        referenceId: gift._id,
        referenceType: 'GiftReward',
        createdBy: new Types.ObjectId(senderId),
        source,
        metadata: { senderName: sender.firstName },
      }),
    );

    await Promise.all(operations);

    NotificationService.sendToUser(
      receiverId,
      'Points Received!',
      `${sender.firstName} sent you ${amount} Reward Points!${message ? ` - ${message}` : ''}`,
    ).catch(() => {});

    return {
      giftId: gift._id,
      receiverRewardPoints: receiverWallet.rewardPoints,
      senderRewardPoints: senderWallet?.rewardPoints ?? 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Gift Coins
  // ---------------------------------------------------------------------------

  static async giftCoins(
    senderId: string,
    receiverId: string,
    amount: number,
    message?: string,
  ): Promise<Record<string, unknown>> {
    if (amount <= 0) throw new Error('Amount must be positive');

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender) throw new Error('Sender not found');
    if (!receiver) throw new Error('Receiver not found');

    const receiverWallet = await RewardService.getOrCreateWallet(receiverId);
    await RewardService.validateWalletNotFrozen(receiverWallet);

    const balanceBefore = {
      rewardPoints: receiverWallet.rewardPoints,
      redeemCoins: receiverWallet.redeemCoins,
    };

    receiverWallet.redeemCoins += amount;
    receiverWallet.lifetimeRedeemCoinsEarned += amount;

    const balanceAfter = {
      rewardPoints: receiverWallet.rewardPoints,
      redeemCoins: receiverWallet.redeemCoins,
    };

    const gift = await GiftReward.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      type: 'redeem_coins',
      amount,
      message: message ?? '',
      status: 'sent',
    });

    await receiverWallet.save();

    await RewardTransaction.create({
      userId: new Types.ObjectId(receiverId),
      walletId: receiverWallet._id,
      actionType: 'gift_received',
      rewardPoints: 0,
      redeemCoins: amount,
      balanceBefore,
      balanceAfter,
      description: message
        ? `Received ${amount} RC from ${sender.firstName}: ${message}`
        : `Received ${amount} RC from ${sender.firstName}`,
      referenceId: gift._id,
      referenceType: 'GiftReward',
      createdBy: new Types.ObjectId(senderId),
      source: 'parent',
      metadata: { senderName: sender.firstName },
    });

    NotificationService.sendToUser(
      receiverId,
      'Coins Received!',
      `${sender.firstName} sent you ${amount} Redeem Coins!${message ? ` - ${message}` : ''}`,
    ).catch(() => {});

    return { giftId: gift._id, redeemCoins: receiverWallet.redeemCoins };
  }

  // ---------------------------------------------------------------------------
  // Validate balance
  // ---------------------------------------------------------------------------

  static async validateBalance(childId: string, coins: number): Promise<{ valid: boolean; balance: number }> {
    const wallet = await Wallet.findOne({ childId });
    if (!wallet) return { valid: false, balance: 0 };
    return { valid: wallet.redeemCoins >= coins, balance: wallet.redeemCoins };
  }

  // ---------------------------------------------------------------------------
  // Wallet status (freeze/unfreeze)
  // ---------------------------------------------------------------------------

  static async setWalletStatus(childId: string, status: 'active' | 'frozen' | 'suspended'): Promise<Record<string, unknown>> {
    const wallet = await Wallet.findOne({ childId });
    if (!wallet) throw new Error('Wallet not found');

    wallet.status = status;
    await wallet.save();

    NotificationService.sendToUser(
      childId,
      status === 'frozen' ? 'Wallet Frozen' : status === 'active' ? 'Wallet Unfrozen' : 'Wallet Suspended',
      status === 'frozen'
        ? 'Your wallet has been frozen. Contact a parent or admin.'
        : status === 'active'
          ? 'Your wallet is now active again!'
          : 'Your wallet has been suspended. Contact support.',
    ).catch(() => {});

    return { status: wallet.status };
  }

  // ---------------------------------------------------------------------------
  // Reverse transaction
  // ---------------------------------------------------------------------------

  static async reverseTransaction(transactionId: string, adminId: string, reason: string): Promise<Record<string, unknown>> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await RewardTransaction.findById(transactionId).session(session);
      if (!transaction) throw new Error('Transaction not found');

      const wallet = await Wallet.findById(transaction.walletId).session(session);
      if (!wallet) throw new Error('Wallet not found');

      const user = await User.findById(transaction.userId).session(session);
      if (!user) throw new Error('User not found');

      const reverseRewardPoints = -(transaction.rewardPoints ?? 0);
      const reverseRedeemCoins = -(transaction.redeemCoins ?? 0);

      const balanceBefore = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      wallet.rewardPoints = Math.max(0, wallet.rewardPoints + reverseRewardPoints);
      wallet.redeemCoins = Math.max(0, wallet.redeemCoins + reverseRedeemCoins);
      user.points = Math.max(0, (user.points ?? 0) + reverseRewardPoints);

      const balanceAfter = {
        rewardPoints: wallet.rewardPoints,
        redeemCoins: wallet.redeemCoins,
      };

      const reversalTransaction = await RewardTransaction.create([{
        userId: transaction.userId,
        walletId: wallet._id,
        actionType: 'admin_adjustment',
        rewardPoints: reverseRewardPoints,
        redeemCoins: reverseRedeemCoins,
        balanceBefore,
        balanceAfter,
        description: `Reversal of ${transaction._id}: ${reason}`,
        referenceId: transaction._id,
        referenceType: 'RewardTransaction',
        createdBy: new Types.ObjectId(adminId),
        source: 'admin',
        metadata: { originalTransactionId: transaction._id.toString(), reason },
      }], { session });

      await wallet.save({ session });
      await user.save({ session });
      await transaction.save({ session });
      await session.commitTransaction();

      return {
        reversed: true,
        transaction: reversalTransaction[0].toObject(),
        wallet: {
          rewardPoints: wallet.rewardPoints,
          redeemCoins: wallet.redeemCoins,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Transaction history
  // ---------------------------------------------------------------------------

  static async getHistory(
    userId: string,
    page = DEFAULT_PAGE,
    limit = DEFAULT_PAGE_LIMIT,
    actionType?: string,
  ) {
    const filter: Record<string, unknown> = { userId };
    if (actionType) filter.actionType = actionType;

    const total = await RewardTransaction.countDocuments(filter);
    const transactions = await RewardTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ---------------------------------------------------------------------------
  // Conversion list
  // ---------------------------------------------------------------------------

  static async getConversions(userId: string, status?: string) {
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    return RewardConversion.find(filter).sort({ createdAt: -1 }).lean();
  }

  static async getPendingConversionsForFamily(familyId: string) {
    const children = await User.find({ familyId, role: ROLES.CHILD }).select('_id firstName').lean();
    const childIds = children.map(c => c._id);
    return RewardConversion.find({
      userId: { $in: childIds },
      status: 'pending',
    }).sort({ createdAt: -1 }).populate('userId', 'firstName lastName').lean();
  }

  // ---------------------------------------------------------------------------
  // Admin: adjust balance, freeze, economy stats
  // ---------------------------------------------------------------------------

  static async adjustBalance(
    userId: string,
    adminId: string,
    pointsDelta: number,
    coinsDelta: number,
    reason: string,
  ): Promise<Record<string, unknown>> {
    const wallet = await RewardService.getOrCreateWallet(userId);
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const balanceBefore = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    const newPoints = wallet.rewardPoints + pointsDelta;
    wallet.rewardPoints = Math.max(0, newPoints);

    const newCoins = wallet.redeemCoins + coinsDelta;
    wallet.redeemCoins = Math.max(0, newCoins);

    if (coinsDelta > 0) wallet.lifetimeRedeemCoinsEarned += coinsDelta;
    if (pointsDelta > 0) wallet.lifetimeRewardPointsEarned += pointsDelta;

    user.points = Math.max(0, (user.points ?? 0) + pointsDelta);

    const balanceAfter = {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
    };

    await wallet.save();
    await user.save();

    await RewardTransaction.create({
      userId: new Types.ObjectId(userId),
      walletId: wallet._id,
      actionType: 'admin_adjustment',
      rewardPoints: pointsDelta,
      redeemCoins: coinsDelta,
      balanceBefore,
      balanceAfter,
      description: reason,
      createdBy: new Types.ObjectId(adminId),
      source: 'admin',
      metadata: { adminNote: reason },
    });

    await Activity.create({
      familyId: user.familyId,
      actorId: new Types.ObjectId(adminId),
      type: 'reward_adjusted',
      message: `Admin adjusted ${user.firstName}'s balance: ${pointsDelta} RP, ${coinsDelta} RC — ${reason}`,
      metadata: { pointsDelta, coinsDelta, reason, targetUserId: userId },
    });

    return {
      rewardPoints: wallet.rewardPoints,
      redeemCoins: wallet.redeemCoins,
      pointsDelta,
      coinsDelta,
    };
  }

  static async getEconomyStats() {
    const [totalWallets, totalTransactions, totalConversions, topEarners, totalCoinsSpentResult] = await Promise.all([
      Wallet.countDocuments(),
      RewardTransaction.countDocuments(),
      RewardConversion.countDocuments({ status: 'approved' }),
      RewardTransaction.aggregate([
        { $match: { rewardPoints: { $gt: 0 }, actionType: { $ne: 'conversion_to_coins' } } },
        { $group: { _id: '$userId', totalEarned: { $sum: '$rewardPoints' } } },
        { $sort: { totalEarned: -1 } },
        { $limit: 10 },
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
            totalEarned: 1,
            firstName: '$user.firstName',
            lastName: '$user.lastName',
          },
        },
      ]),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: '$lifetimeCoinsSpent' } } },
      ]),
    ]);

    const totalSpent = totalCoinsSpentResult[0]?.total ?? 0;

    const [mostPurchased, earningByAction] = await Promise.all([
      RewardTransaction.aggregate([
        { $match: { actionType: 'purchase' } },
        { $group: { _id: '$metadata.itemName', count: { $sum: 1 }, totalCoins: { $sum: { $abs: '$redeemCoins' } } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      RewardTransaction.aggregate([
        { $match: { rewardPoints: { $gt: 0 } } },
        { $group: { _id: '$actionType', total: { $sum: '$rewardPoints' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      totalWallets,
      totalTransactions,
      totalConversions,
      topEarners,
      mostPurchased,
      earningByAction,
      totalCoinsSpent: totalSpent,
    };
  }

  // ---------------------------------------------------------------------------
  // Legacy Family Reward management (Reward model)
  // ---------------------------------------------------------------------------

  static async listRewards(familyId: string, userId?: string, role?: string) {
    const rewards = await Reward.find(role === ROLES.CHILD ? { familyId, isActive: true } : { familyId })
      .sort({ pointsCost: 1 })
      .lean();

    if (userId) {
      const user = await User.findById(userId).select('points streak').lean();
      if (user) {
        return rewards.map((reward) => ({
          ...reward,
          canRedeem: (user.points ?? 0) >= reward.pointsCost && (!reward.unlockedAtStreak || (user.streak ?? 0) >= reward.unlockedAtStreak),
          userPoints: user.points,
        }));
      }
    }

    return rewards.map((reward) => ({ ...reward, canRedeem: false }));
  }

  static async createReward(
    familyId: string,
    actorId: string,
    input: { title: string; description?: string; pointsCost: number; unlockedAtStreak?: number },
  ) {
    const reward = await Reward.create({
      familyId,
      title: input.title,
      description: input.description ?? '',
      pointsCost: input.pointsCost,
      unlockedAtStreak: input.unlockedAtStreak ?? 0,
    });

    await Activity.create({
      familyId,
      actorId,
      type: 'reward_created',
      message: `Created reward "${reward.title}"`,
      metadata: { rewardId: reward.id },
    });

    return reward;
  }

  static async updateReward(
    rewardId: string,
    familyId: string,
    actorId: string,
    input: {
      title?: string;
      description?: string;
      pointsCost?: number;
      unlockedAtStreak?: number;
      isActive?: boolean;
    },
  ) {
    const reward = await Reward.findOne({ _id: rewardId, familyId });
    if (!reward) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Reward not found');
    }

    Object.assign(reward, input);
    await reward.save();

    await Activity.create({
      familyId,
      actorId,
      type: 'reward_updated',
      message: `Updated reward "${reward.title}"`,
      metadata: { rewardId: reward.id },
    });

    return reward;
  }

  static async deleteReward(rewardId: string, familyId: string, actorId: string) {
    const reward = await Reward.findOneAndDelete({ _id: rewardId, familyId });
    if (!reward) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Reward not found');
    }

    await Activity.create({
      familyId,
      actorId,
      type: 'reward_updated',
      message: `Deleted reward "${reward.title}"`,
      metadata: { rewardId },
    });

    return { success: true };
  }

  static async redeemReward(rewardId: string, userId: string, familyId: string) {
    const reward = await Reward.findOne({ _id: rewardId, familyId, isActive: true });
    if (!reward) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Reward not found');
    }

    const wallet = await Wallet.findOne({ childId: userId });
    if (!wallet) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Wallet not found');
    }

    if (wallet.rewardPoints < reward.pointsCost) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Not enough points to redeem this reward');
    }

    if (reward.unlockedAtStreak) {
      const user = await User.findById(userId).select('streak').lean();
      if (!user || (user.streak ?? 0) < reward.unlockedAtStreak) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `You need a ${reward.unlockedAtStreak}-day streak to unlock this reward`);
      }
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

    const balanceBefore = { rewardPoints: wallet.rewardPoints, redeemCoins: wallet.redeemCoins };

    wallet.rewardPoints -= reward.pointsCost;
    user.points = Math.max(0, (user.points ?? 0) - reward.pointsCost);

    if (!user.obtainedRewards) {
      (user as any).obtainedRewards = [];
    }
    (user as any).obtainedRewards.push({
      rewardId: reward._id,
      title: reward.title,
      redeemedAt: new Date(),
      pointsSpent: reward.pointsCost,
    });

    const balanceAfter = { rewardPoints: wallet.rewardPoints, redeemCoins: wallet.redeemCoins };

    await Promise.all([
      wallet.save(),
      user.save(),
      RewardTransaction.create({
        userId: new Types.ObjectId(userId),
        walletId: wallet._id,
        actionType: 'purchase',
        rewardPoints: -reward.pointsCost,
        redeemCoins: 0,
        balanceBefore,
        balanceAfter,
        description: `Redeemed reward "${reward.title}" for ${reward.pointsCost} RP`,
        referenceId: reward._id,
        referenceType: 'Reward',
        createdBy: new Types.ObjectId(userId),
        source: 'child',
        metadata: { rewardTitle: reward.title, pointsCost: reward.pointsCost },
      }),
    ]);

    await Activity.create({
      familyId,
      actorId: userId,
      type: 'reward_redeemed',
      message: `${user.firstName} redeemed "${reward.title}" for ${reward.pointsCost} points`,
      metadata: { rewardId, pointsSpent: reward.pointsCost },
    });

    return {
      success: true,
      reward: { title: reward.title, pointsCost: reward.pointsCost },
      remainingPoints: wallet.rewardPoints,
    };
  }
}
