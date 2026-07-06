import mongoose, { Types } from 'mongoose';
import { Wallet } from '../models/wallet.model.js';
import { RewardStoreItem } from '../models/reward-store-item.model.js';
import { RewardCategory } from '../models/reward-category.model.js';
import { PurchasedItem } from '../models/purchased-item.model.js';
import { PurchaseApproval } from '../models/purchase-approval.model.js';
import { RewardTransaction } from '../models/reward-transaction.model.js';
import { GiftReward } from '../models/gift-reward.model.js';
import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { NotificationService } from './notification.service.js';
import { ROLES } from '../constants/roles.js';
import { DEFAULT_PAGE, DEFAULT_PAGE_LIMIT } from '../constants/reward-economy.js';

const APPROVAL_EXPIRY_HOURS = 48;

export class RewardStoreService {
  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  static async listCategories(type?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter.type = type;
    return RewardCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async listAllCategories() {
    return RewardCategory.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async createCategory(data: {
    name: string; slug: string; description?: string; icon?: string; imageUrl?: string;
    type: 'avatar_customization' | 'goodies' | 'physical_rewards'; sortOrder?: number;
  }) {
    const existing = await RewardCategory.findOne({ slug: data.slug });
    if (existing) throw new Error('Category slug already exists');
    return RewardCategory.create({
      name: data.name, slug: data.slug, description: data.description ?? '',
      icon: data.icon ?? '', imageUrl: data.imageUrl ?? '', type: data.type,
      sortOrder: data.sortOrder ?? 0, isActive: true,
    });
  }

  static async updateCategory(categoryId: string, data: Partial<{
    name: string; description: string; icon: string; imageUrl: string;
    type: string; sortOrder: number; isActive: boolean;
  }>) {
    const category = await RewardCategory.findByIdAndUpdate(categoryId, data, { new: true });
    if (!category) throw new Error('Category not found');
    return category;
  }

  static async deleteCategory(categoryId: string) {
    const itemCount = await RewardStoreItem.countDocuments({ category: categoryId });
    if (itemCount > 0) throw new Error(`Category has ${itemCount} items. Archive it instead.`);
    const category = await RewardCategory.findByIdAndDelete(categoryId);
    if (!category) throw new Error('Category not found');
    return { deleted: true };
  }

  static async archiveCategory(categoryId: string) {
    const category = await RewardCategory.findByIdAndUpdate(
      categoryId, { isActive: false }, { new: true },
    );
    if (!category) throw new Error('Category not found');
    await RewardStoreItem.updateMany({ category: categoryId }, { isAvailable: false });
    return category;
  }

  // ---------------------------------------------------------------------------
  // Items — public listing
  // ---------------------------------------------------------------------------

  static async listItems(
    userId: string,
    categorySlug?: string,
    rarity?: string,
    search?: string,
    page = DEFAULT_PAGE,
    limit = DEFAULT_PAGE_LIMIT,
  ) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const filter: Record<string, unknown> = { isAvailable: true };

    if (categorySlug) {
      const category = await RewardCategory.findOne({ slug: categorySlug, isActive: true });
      if (category) filter.category = category._id;
    }
    if (rarity) filter.rarity = rarity;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const now = new Date();
    filter.$and = [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      { unlockLevel: { $lte: user.level ?? 1 } },
    ];

    const total = await RewardStoreItem.countDocuments(filter);
    const items = await RewardStoreItem.find(filter)
      .populate('category', 'name slug type')
      .sort({ isFeatured: -1, sortOrder: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const purchasedItems = await PurchasedItem.find({ userId }).select('itemId').lean();
    const ownedItemIds = new Set(purchasedItems.map(p => p.itemId.toString()));

    return {
      items: items.map(item => ({
        ...item,
        isOwned: ownedItemIds.has(item._id.toString()),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getFeaturedItems() {
    const now = new Date();
    return RewardStoreItem.find({
      isAvailable: true, isFeatured: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .populate('category', 'name slug type')
      .sort({ sortOrder: 1 })
      .limit(10)
      .lean();
  }

  static async getRecentlyAdded(limit = 10) {
    const now = new Date();
    return RewardStoreItem.find({
      isAvailable: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
      ],
    })
      .populate('category', 'name slug type')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getSeasonalItems() {
    const now = new Date();
    return RewardStoreItem.find({
      isAvailable: true,
      limitedEdition: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('category', 'name slug type')
      .sort({ sortOrder: 1 })
      .lean();
  }

  static async getItemDetail(itemId: string, userId: string) {
    const [item, purchase, pendingApproval] = await Promise.all([
      RewardStoreItem.findById(itemId).populate('category', 'name slug type').lean(),
      PurchasedItem.findOne({ userId, itemId }),
      PurchaseApproval.findOne({ childId: userId, itemId, status: 'pending' }),
    ]);
    if (!item) throw new Error('Item not found');

    return {
      ...item,
      isOwned: !!purchase,
      purchase: purchase?.toObject() ?? null,
      pendingApproval: pendingApproval?.toObject() ?? null,
    };
  }

  // ---------------------------------------------------------------------------
  // Purchase flow
  // ---------------------------------------------------------------------------

  static async purchaseItem(itemId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [item, user] = await Promise.all([
        RewardStoreItem.findById(itemId).session(session),
        User.findById(userId).session(session),
      ]);

      if (!item) throw new Error('Item not found');
      if (!user) throw new Error('User not found');
      if (!item.isAvailable) throw new Error('Item is not available');
      if (user.level && user.level < item.unlockLevel) {
        throw new Error(`Level ${item.unlockLevel} required`);
      }

      const now = new Date();
      if (item.startDate && item.startDate > now) throw new Error('Item is not yet available');
      if (item.endDate && item.endDate < now) throw new Error('Item is no longer available');

      const existing = await PurchasedItem.findOne({ userId, itemId }).session(session);
      if (existing) throw new Error('Item already owned');

      if (item.stock !== -1 && item.stock <= 0) throw new Error('Item is out of stock');

      const pendingApproval = await PurchaseApproval.findOne({
        childId: userId, itemId, status: 'pending',
      }).session(session);
      if (pendingApproval) throw new Error('Purchase pending parent approval');

      const wallet = await Wallet.findOne({ childId: userId }).session(session);
      if (!wallet) throw new Error('Wallet not found');
      if (wallet.status !== 'active') throw new Error('Wallet is frozen');
      if (wallet.redeemCoins < item.coinCost) throw new Error('Insufficient Redeem Coins');

      const balanceBefore = { rewardPoints: wallet.rewardPoints, redeemCoins: wallet.redeemCoins };

      wallet.redeemCoins -= item.coinCost;
      wallet.lifetimeCoinsSpent += item.coinCost;
      if (item.stock !== -1) item.stock -= 1;

      const [transaction] = await RewardTransaction.create([{
        userId, walletId: wallet._id, actionType: 'purchase',
        rewardPoints: 0, redeemCoins: -item.coinCost,
        balanceBefore,
        balanceAfter: { rewardPoints: wallet.rewardPoints, redeemCoins: wallet.redeemCoins },
        description: `Purchased: ${item.name}`,
        referenceId: item._id, referenceType: 'RewardStoreItem',
        createdBy: new Types.ObjectId(userId), source: 'child',
        metadata: { itemName: item.name, itemCategory: item.category.toString(), rarity: item.rarity },
      }], { session });

      const [purchasedItem] = await PurchasedItem.create([{
        userId, itemId: item._id, itemName: item.name,
        itemCategory: item.category, coinCost: item.coinCost,
        rarity: item.rarity, purchasedAt: new Date(), isEquipped: false,
        transactionRef: transaction._id, source: 'purchased',
      }], { session });

      await Promise.all([wallet.save({ session }), item.save({ session })]);
      await session.commitTransaction();

      NotificationService.sendToUser(
        userId, 'Purchase Successful!', `You bought ${item.name}! Check your inventory.`,
      );

      return {
        purchasedItem: purchasedItem.toObject(),
        redeemCoins: wallet.redeemCoins,
        transactionId: transaction._id,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ---------------------------------------------------------------------------
  // Purchase approval flow
  // ---------------------------------------------------------------------------

  static async requestPurchase(itemId: string, childId: string) {
    const [item, user, existing] = await Promise.all([
      RewardStoreItem.findById(itemId),
      User.findById(childId),
      PurchasedItem.findOne({ userId: childId, itemId }),
    ]);

    if (!item) throw new Error('Item not found');
    if (!user) throw new Error('User not found');
    if (!item.isAvailable) throw new Error('Item is not available');
    if (!item.parentApprovalRequired) throw new Error('This item does not require approval');
    if (existing) throw new Error('Item already owned');
    if (user.level && user.level < item.unlockLevel) {
      throw new Error(`Level ${item.unlockLevel} required`);
    }

    const now = new Date();
    if (item.startDate && item.startDate > now) throw new Error('Item not yet available');
    if (item.endDate && item.endDate < now) throw new Error('Item no longer available');

    const parent = await User.findById(user.parentId);
    if (!parent) throw new Error('No parent found for this child');

    const pending = await PurchaseApproval.findOne({ childId, itemId, status: 'pending' });
    if (pending) throw new Error('Purchase request already pending');

    const expiresAt = new Date(Date.now() + APPROVAL_EXPIRY_HOURS * 60 * 60 * 1000);

    const approval = await PurchaseApproval.create({
      childId, parentId: parent._id, itemId, itemName: item.name,
      coinCost: item.coinCost, status: 'pending', expiresAt,
    });

    NotificationService.sendToUser(
      parent._id.toString(), 'Purchase Approval Required',
      `${user.firstName} wants to buy ${item.name} for ${item.coinCost} coins.`,
      { type: 'purchase_approval', approvalId: approval._id.toString() },
    );

    return { approvalId: approval._id, status: 'pending', itemName: item.name, coinCost: item.coinCost };
  }

  static async approvePurchase(approvalId: string, parentId: string) {
    const approval = await PurchaseApproval.findById(approvalId);
    if (!approval) throw new Error('Approval request not found');
    if (approval.parentId.toString() !== parentId) throw new Error('Not authorized');
    if (approval.status !== 'pending') throw new Error(`Request is ${approval.status}, not pending`);
    if (approval.expiresAt < new Date()) {
      approval.status = 'expired';
      await approval.save();
      throw new Error('Approval request has expired');
    }

    approval.status = 'approved';
    approval.approvedAt = new Date();
    await approval.save();

    const result = await RewardStoreService.purchaseItem(
      approval.itemId.toString(), approval.childId.toString(),
    );

    NotificationService.sendToUser(
      approval.childId.toString(), 'Purchase Approved!',
      `Your parent approved the purchase of ${approval.itemName}!`,
    );

    return { ...result, approvalId: approval._id, approvalStatus: 'approved' };
  }

  static async rejectPurchase(approvalId: string, parentId: string, reason?: string) {
    const approval = await PurchaseApproval.findById(approvalId);
    if (!approval) throw new Error('Approval request not found');
    if (approval.parentId.toString() !== parentId) throw new Error('Not authorized');
    if (approval.status !== 'pending') throw new Error(`Request is ${approval.status}`);

    approval.status = 'rejected';
    approval.rejectedAt = new Date();
    approval.rejectionReason = reason ?? '';
    await approval.save();

    NotificationService.sendToUser(
      approval.childId.toString(), 'Purchase Rejected',
      reason
        ? `Your parent rejected the purchase of ${approval.itemName}: ${reason}`
        : `Your parent rejected the purchase of ${approval.itemName}.`,
    );

    return { approvalId: approval._id, status: 'rejected', itemName: approval.itemName };
  }

  static async cancelPurchase(approvalId: string, childId: string) {
    const approval = await PurchaseApproval.findOneAndUpdate(
      { _id: approvalId, childId, status: 'pending' },
      { status: 'cancelled' },
      { new: true },
    );
    if (!approval) throw new Error('Pending approval request not found');
    return { approvalId: approval._id, status: 'cancelled' };
  }

  static async getPendingApprovals(parentId: string) {
    return PurchaseApproval.find({ parentId, status: 'pending' })
      .populate('childId', 'firstName lastName')
      .populate('itemId', 'name description imageUrl coinCost rarity')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getChildApprovals(childId: string) {
    return PurchaseApproval.find({ childId })
      .populate('itemId', 'name description imageUrl coinCost rarity')
      .sort({ createdAt: -1 })
      .lean();
  }

  // ---------------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------------

  static async getInventory(userId: string, categoryType?: string) {
    const filter: Record<string, unknown> = { userId };

    if (categoryType) {
      const categories = await RewardCategory.find({ type: categoryType, isActive: true }).select('_id').lean();
      const categoryIds = categories.map(c => c._id);
      filter.itemCategory = { $in: categoryIds };
    }

    const items = await PurchasedItem.find(filter)
      .populate('itemId', 'name description imageUrl previewImage rarity category tags coinCost')
      .sort({ purchasedAt: -1 })
      .lean();

    return items.map(item => {
      const populatedItem = item.itemId as unknown as { category?: unknown } | null;
      return {
        ...item,
        category: populatedItem?.category ?? item.itemCategory,
      };
    });
  }

  static async getEquipped(userId: string) {
    return PurchasedItem.find({ userId, isEquipped: true })
      .populate('itemId', 'name description imageUrl previewImage rarity category tags')
      .populate('itemCategory', 'name slug type')
      .lean();
  }

  // ---------------------------------------------------------------------------
  // Equip / Unequip
  // ---------------------------------------------------------------------------

  static async equipItem(purchasedItemId: string, userId: string) {
    const purchasedItem = await PurchasedItem.findById(purchasedItemId);
    if (!purchasedItem) throw new Error('Purchased item not found');
    if (purchasedItem.userId.toString() !== userId) throw new Error('Item not owned by user');

    const storeItem = await RewardStoreItem.findById(purchasedItem.itemId);
    if (!storeItem) throw new Error('Store item not found');

    if (purchasedItem.isEquipped) {
      return { isEquipped: true, itemId: purchasedItem.itemId, alreadyEquipped: true };
    }

    const category = await RewardCategory.findById(storeItem.category);
    const categoryType = category?.type;

    if (categoryType === 'avatar_customization') {
      await PurchasedItem.updateMany(
        { userId, _id: { $ne: purchasedItemId }, isEquipped: true, rarity: purchasedItem.rarity },
        { isEquipped: false },
      );
    }

    purchasedItem.isEquipped = true;
    await purchasedItem.save();

    return { isEquipped: true, itemId: purchasedItem.itemId, alreadyEquipped: false };
  }

  static async unequipItem(purchasedItemId: string, userId: string) {
    const purchasedItem = await PurchasedItem.findById(purchasedItemId);
    if (!purchasedItem) throw new Error('Purchased item not found');
    if (purchasedItem.userId.toString() !== userId) throw new Error('Item not owned by user');
    if (!purchasedItem.isEquipped) throw new Error('Item is not equipped');

    purchasedItem.isEquipped = false;
    await purchasedItem.save();

    return { isEquipped: false, itemId: purchasedItem.itemId };
  }

  // ---------------------------------------------------------------------------
  // Gift item
  // ---------------------------------------------------------------------------

  static async giftItem(purchasedItemId: string, senderId: string, receiverId: string, message?: string) {
    const purchasedItem = await PurchasedItem.findById(purchasedItemId);
    if (!purchasedItem) throw new Error('Purchased item not found');
    if (purchasedItem.userId.toString() !== senderId) throw new Error('Item not owned by sender');
    if (purchasedItem.isEquipped) throw new Error('Unequip item before gifting');

    const storeItem = await RewardStoreItem.findById(purchasedItem.itemId);
    if (!storeItem) throw new Error('Store item not found');
    if (!storeItem.giftable) throw new Error('This item cannot be gifted');

    const [sender, receiver] = await Promise.all([
      User.findById(senderId), User.findById(receiverId),
    ]);
    if (!sender || !receiver) throw new Error('User not found');

    const gift = await GiftReward.create({
      senderId, receiverId, type: 'store_item', amount: purchasedItem.coinCost,
      itemId: storeItem._id, message: message ?? '', status: 'sent',
    });

    purchasedItem.userId = new Types.ObjectId(receiverId);
    purchasedItem.source = 'gifted';
    purchasedItem.giftFrom = new Types.ObjectId(senderId);
    purchasedItem.isEquipped = false;
    await purchasedItem.save();

    NotificationService.sendToUser(
      receiverId, 'Item Received!',
      `${sender.firstName} sent you ${storeItem.name}!${message ? ` - ${message}` : ''}`,
    );

    return { giftId: gift._id, itemName: storeItem.name, receiverId };
  }

  // ---------------------------------------------------------------------------
  // Admin — item management
  // ---------------------------------------------------------------------------

  static async getAdminItems(page = DEFAULT_PAGE, limit = DEFAULT_PAGE_LIMIT, filter?: {
    category?: string; rarity?: string; isAvailable?: boolean; isFeatured?: boolean;
    search?: string;
  }) {
    const query: Record<string, unknown> = {};
    if (filter?.category) query.category = filter.category;
    if (filter?.rarity) query.rarity = filter.rarity;
    if (filter?.isAvailable !== undefined) query.isAvailable = filter.isAvailable;
    if (filter?.isFeatured !== undefined) query.isFeatured = filter.isFeatured;
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const total = await RewardStoreItem.countDocuments(query);
    const items = await RewardStoreItem.find(query)
      .populate('category', 'name slug type')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createItem(data: {
    name: string; description?: string; imageUrl?: string; previewImage?: string;
    thumbnail?: string; assetReference?: string; category: string;
    coinCost: number; rewardPointCost?: number; rarity?: string;
    stock?: number; unlockLevel?: number; limitedEdition?: boolean;
    isPremium?: boolean; giftable?: boolean; isFeatured?: boolean;
    parentApprovalRequired?: boolean; sortOrder?: number; tags?: string[];
    startDate?: string; endDate?: string; createdBy: string;
  }) {
    const category = await RewardCategory.findById(data.category);
    if (!category) throw new Error('Category not found');

    return RewardStoreItem.create({
      name: data.name, description: data.description ?? '',
      imageUrl: data.imageUrl ?? '', previewImage: data.previewImage ?? '',
      thumbnail: data.thumbnail ?? '', assetReference: data.assetReference ?? '',
      category: data.category, coinCost: data.coinCost,
      rewardPointCost: data.rewardPointCost ?? 0,
      rarity: data.rarity ?? 'common', stock: data.stock ?? -1,
      unlockLevel: data.unlockLevel ?? 1, limitedEdition: data.limitedEdition ?? false,
      isPremium: data.isPremium ?? false, giftable: data.giftable ?? true,
      isFeatured: data.isFeatured ?? false, parentApprovalRequired: data.parentApprovalRequired ?? false,
      sortOrder: data.sortOrder ?? 0, tags: data.tags ?? [],
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdBy: data.createdBy, isAvailable: true,
    });
  }

  static async updateItem(itemId: string, data: Partial<{
    name: string; description: string; imageUrl: string; previewImage: string;
    thumbnail: string; assetReference: string; category: string;
    coinCost: number; rewardPointCost: number; rarity: string;
    stock: number; isAvailable: boolean; isFeatured: boolean; isPremium: boolean;
    limitedEdition: boolean; giftable: boolean; unlockLevel: number;
    parentApprovalRequired: boolean; sortOrder: number; tags: string[];
    startDate: Date; endDate: Date;
  }>) {
    const item = await RewardStoreItem.findByIdAndUpdate(itemId, data, { new: true });
    if (!item) throw new Error('Item not found');
    return item;
  }

  static async deleteItem(itemId: string) {
    const purchases = await PurchasedItem.countDocuments({ itemId });
    if (purchases > 0) throw new Error(`Item has ${purchases} purchases. Archive it instead.`);
    const item = await RewardStoreItem.findByIdAndDelete(itemId);
    if (!item) throw new Error('Item not found');
    return { deleted: true };
  }

  static async archiveItem(itemId: string) {
    const item = await RewardStoreItem.findByIdAndUpdate(
      itemId, { isAvailable: false }, { new: true },
    );
    if (!item) throw new Error('Item not found');
    return item;
  }

  static async duplicateItem(itemId: string, createdBy: string) {
    const source = await RewardStoreItem.findById(itemId);
    if (!source) throw new Error('Item not found');

    const duplicate = await RewardStoreItem.create({
      name: `${source.name} (copy)`, description: source.description,
      imageUrl: source.imageUrl, previewImage: source.previewImage,
      thumbnail: source.thumbnail, assetReference: source.assetReference,
      category: source.category, coinCost: source.coinCost,
      rewardPointCost: source.rewardPointCost, rarity: source.rarity,
      stock: source.stock, unlockLevel: source.unlockLevel,
      limitedEdition: false, isPremium: source.isPremium, giftable: source.giftable,
      isFeatured: false, parentApprovalRequired: source.parentApprovalRequired,
      sortOrder: source.sortOrder, tags: [...source.tags],
      createdBy, isAvailable: true,
    });
    return duplicate;
  }
}
