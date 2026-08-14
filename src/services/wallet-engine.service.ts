import { Wallet, IWallet } from '../models/wallet-v2.model.js';
import { WalletTransaction, IWalletTransaction } from '../models/wallet-transaction.model.js';
import { Types } from 'mongoose';

export class WalletEngine {
  static async getOrCreateWallet(childId: string, familyId: string): Promise<IWallet> {
    let wallet = await Wallet.findOne({ childId });
    if (!wallet) {
      wallet = await Wallet.create({ childId, familyId });
    }
    return wallet;
  }

  static async credit(
    childId: string,
    familyId: string,
    params: {
      currency: 'coins' | 'points' | 'xp' | 'energy' | 'stars' | 'gems';
      amount: number;
      type: IWalletTransaction['type'];
      description: string;
      referenceId?: string;
      referenceModel?: string;
      idempotencyKey?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    if (params.amount <= 0) throw new Error('Amount must be positive');

    if (params.idempotencyKey) {
      const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey });
      if (existing) {
        const wallet = await Wallet.findOne({ childId });
        return { wallet: wallet!, transaction: existing };
      }
    }

    const wallet = await this.getOrCreateWallet(childId, familyId);
    const balanceBefore = wallet[params.currency as keyof IWallet] as number;

    const update: Record<string, any> = {};
    update[params.currency] = params.amount;
    if (params.currency !== 'energy') {
      const lifetimeField = `lifetime${params.currency.charAt(0).toUpperCase() + params.currency.slice(1)}` as keyof IWallet;
      if (lifetimeField in wallet) {
        update[lifetimeField] = params.amount;
      }
    }

    const updatedWallet = await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: update },
      { new: true },
    );

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      childId,
      familyId,
      type: params.type,
      currency: params.currency,
      amount: params.amount,
      balanceBefore,
      balanceAfter: balanceBefore + params.amount,
      referenceId: params.referenceId ? new Types.ObjectId(params.referenceId) : undefined,
      referenceModel: params.referenceModel,
      description: params.description,
      idempotencyKey: params.idempotencyKey,
      metadata: params.metadata,
    });

    return { wallet: updatedWallet!, transaction };
  }

  static async debit(
    childId: string,
    familyId: string,
    params: {
      currency: 'coins' | 'points' | 'xp' | 'energy' | 'stars' | 'gems';
      amount: number;
      type: IWalletTransaction['type'];
      description: string;
      referenceId?: string;
      referenceModel?: string;
      idempotencyKey?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    if (params.amount <= 0) throw new Error('Amount must be positive');

    if (params.idempotencyKey) {
      const existing = await WalletTransaction.findOne({ idempotencyKey: params.idempotencyKey });
      if (existing) {
        const wallet = await Wallet.findOne({ childId });
        return { wallet: wallet!, transaction: existing };
      }
    }

    const wallet = await this.getOrCreateWallet(childId, familyId);
    const balanceBefore = wallet[params.currency as keyof IWallet] as number;

    if (balanceBefore < params.amount) {
      throw new Error(`Insufficient ${params.currency}. Available: ${balanceBefore}, Required: ${params.amount}`);
    }

    const update: Record<string, number> = {};
    update[params.currency] = -params.amount;

    const updatedWallet = await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: update },
      { new: true },
    );

    const totalSpentUpdate = params.currency === 'coins' ? { totalSpent: params.amount } : {};

    if (params.currency === 'coins') {
      await Wallet.findByIdAndUpdate(wallet._id, { $inc: totalSpentUpdate });
    }

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      childId,
      familyId,
      type: params.type,
      currency: params.currency,
      amount: -params.amount,
      balanceBefore,
      balanceAfter: balanceBefore - params.amount,
      referenceId: params.referenceId ? new Types.ObjectId(params.referenceId) : undefined,
      referenceModel: params.referenceModel,
      description: params.description,
      idempotencyKey: params.idempotencyKey,
      metadata: params.metadata,
    });

    return { wallet: updatedWallet!, transaction };
  }

  static async getBalance(childId: string): Promise<IWallet> {
    return this.getOrCreateWallet(childId, '');
  }

  static async getTransactionHistory(
    childId: string,
    params?: {
      currency?: string;
      type?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<IWalletTransaction[]> {
    const query: any = { childId };
    if (params?.currency) query.currency = params.currency;
    if (params?.type) query.type = params.type;
    if (params?.startDate || params?.endDate) {
      query.createdAt = {};
      if (params.startDate) query.createdAt.$gte = params.startDate;
      if (params.endDate) query.createdAt.$lte = params.endDate;
    }

    return WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(params?.offset || 0)
      .limit(params?.limit || 50)
      .lean();
  }

  static async getTransactionSummary(
    childId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, { earned: number; spent: number }>> {
    const transactions = await WalletTransaction.find({
      childId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const summary: Record<string, { earned: number; spent: number }> = {};
    const currencies = ['coins', 'points', 'xp', 'energy', 'stars', 'gems'];

    for (const currency of currencies) {
      summary[currency] = { earned: 0, spent: 0 };
    }

    for (const tx of transactions) {
      if (tx.amount > 0) {
        summary[tx.currency].earned += tx.amount;
      } else {
        summary[tx.currency].spent += Math.abs(tx.amount);
      }
    }

    return summary;
  }

  static async adjustBalance(
    childId: string,
    familyId: string,
    params: {
      currency: 'coins' | 'points' | 'xp' | 'energy' | 'stars' | 'gems';
      amount: number;
      reason: string;
      performedBy: string;
    },
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    const wallet = await this.getOrCreateWallet(childId, familyId);
    const balanceBefore = wallet[params.currency as keyof IWallet] as number;

    const updatedWallet = await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: { [params.currency]: params.amount } },
      { new: true },
    );

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      childId,
      familyId,
      type: 'adjustment',
      currency: params.currency,
      amount: params.amount,
      balanceBefore,
      balanceAfter: balanceBefore + params.amount,
      description: `Adjustment by ${params.performedBy}: ${params.reason}`,
      metadata: { performedBy: params.performedBy, reason: params.reason },
    });

    return { wallet: updatedWallet!, transaction };
  }
}
