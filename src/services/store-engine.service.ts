import { StoreItem, StoreRedemption, IStoreItem, IStoreRedemption } from '../models/store.model.js';
import { WalletEngine } from './wallet-engine.service.js';

export class StoreEngine {
  static async getStoreItems(familyId: string, type?: string): Promise<IStoreItem[]> {
    const query: any = { familyId, status: 'active' };
    if (type) query.type = type;

    return StoreItem.find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  static async createItem(data: Partial<IStoreItem>): Promise<IStoreItem> {
    return StoreItem.create(data);
  }

  static async updateItem(itemId: string, updates: Partial<IStoreItem>): Promise<IStoreItem> {
    const item = await StoreItem.findByIdAndUpdate(itemId, updates, { new: true });
    if (!item) throw new Error('Store item not found');
    return item;
  }

  static async requestRedemption(
    storeItemId: string,
    childId: string,
    familyId: string,
  ): Promise<IStoreRedemption> {
    const item = await StoreItem.findById(storeItemId);
    if (!item) throw new Error('Store item not found');
    if (item.status !== 'active') throw new Error('Item not available');
    if (item.stock === 0) throw new Error('Item out of stock');

    if (item.maxPerChild > 0) {
      const existingRedemptions = await StoreRedemption.countDocuments({
        storeItemId,
        childId,
        status: { $in: ['pending', 'approved', 'fulfilled'] },
      });
      if (existingRedemptions >= item.maxPerChild) {
        throw new Error('Maximum redemption limit reached');
      }
    }

    const wallet = await WalletEngine.getBalance(childId);
    if (wallet.coins < item.coinsCost) {
      throw new Error(`Insufficient coins. Required: ${item.coinsCost}, Available: ${wallet.coins}`);
    }

    const redemption = await StoreRedemption.create({
      storeItemId,
      childId,
      familyId,
      coinsCost: item.coinsCost,
      status: 'pending',
      requestedAt: new Date(),
    });

    return redemption;
  }

  static async approveRedemption(
    redemptionId: string,
    parentId: string,
    approved: boolean,
    reason?: string,
  ): Promise<IStoreRedemption> {
    const redemption = await StoreRedemption.findById(redemptionId);
    if (!redemption) throw new Error('Redemption not found');
    if (redemption.status !== 'pending') throw new Error('Redemption already processed');

    if (approved) {
      const item = await StoreItem.findById(redemption.storeItemId);
      if (!item) throw new Error('Store item not found');

      await WalletEngine.debit(redemption.childId.toString(), (redemption.familyId as any).toString(), {
        currency: 'coins',
        amount: redemption.coinsCost,
        type: 'store_redemption',
        description: `Redeemed: ${item.title}`,
        referenceId: redemption._id.toString(),
        referenceModel: 'StoreRedemption',
        idempotencyKey: `redemption_${redemptionId}`,
      });

      if (item.xpReward > 0) {
        await WalletEngine.credit(redemption.childId.toString(), (redemption.familyId as any).toString(), {
          currency: 'xp',
          amount: item.xpReward,
          type: 'store_redemption',
          description: `XP from redeeming: ${item.title}`,
          referenceId: redemption._id.toString(),
          referenceModel: 'StoreRedemption',
        });
      }

      if (item.stock > 0) {
        await StoreItem.findByIdAndUpdate(item._id, {
          $inc: { stock: -1, totalRedeemed: 1 },
        });
      } else {
        await StoreItem.findByIdAndUpdate(item._id, { $inc: { totalRedeemed: 1 } });
      }

      redemption.status = 'approved';
      redemption.reviewedAt = new Date();
      redemption.reviewedBy = parentId as any;
    } else {
      redemption.status = 'rejected';
      redemption.reviewedAt = new Date();
      redemption.reviewedBy = parentId as any;
      redemption.rejectionReason = reason;
    }

    await redemption.save();
    return redemption;
  }

  static async fulfillRedemption(redemptionId: string): Promise<IStoreRedemption> {
    const redemption = await StoreRedemption.findById(redemptionId);
    if (!redemption) throw new Error('Redemption not found');
    if (redemption.status !== 'approved') throw new Error('Redemption not approved');

    redemption.status = 'fulfilled';
    redemption.fulfilledAt = new Date();
    await redemption.save();
    return redemption;
  }

  static async cancelRedemption(redemptionId: string, childId: string): Promise<IStoreRedemption> {
    const redemption = await StoreRedemption.findById(redemptionId);
    if (!redemption) throw new Error('Redemption not found');
    if (redemption.childId.toString() !== childId) throw new Error('Not authorized');
    if (redemption.status !== 'pending') throw new Error('Can only cancel pending redemptions');

    redemption.status = 'cancelled';
    await redemption.save();
    return redemption;
  }

  static async getChildRedemptions(childId: string, status?: string): Promise<IStoreRedemption[]> {
    const query: any = { childId };
    if (status) query.status = status;

    return StoreRedemption.find(query)
      .populate('storeItemId')
      .sort({ requestedAt: -1 })
      .lean();
  }

  static async getFamilyRedemptions(familyId: string, status?: string): Promise<IStoreRedemption[]> {
    const query: any = { familyId };
    if (status) query.status = status;

    return StoreRedemption.find(query)
      .populate('storeItemId')
      .populate('childId', 'name')
      .sort({ requestedAt: -1 })
      .lean();
  }

  static async getStoreStats(familyId: string): Promise<{
    totalItems: number;
    totalRedemptions: number;
    pendingRedemptions: number;
    totalCoinsSpent: number;
  }> {
    const totalItems = await StoreItem.countDocuments({ familyId });
    const redemptions = await StoreRedemption.find({ familyId });

    return {
      totalItems,
      totalRedemptions: redemptions.length,
      pendingRedemptions: redemptions.filter(r => r.status === 'pending').length,
      totalCoinsSpent: redemptions
        .filter(r => ['approved', 'fulfilled'].includes(r.status))
        .reduce((sum, r) => sum + r.coinsCost, 0),
    };
  }
}
