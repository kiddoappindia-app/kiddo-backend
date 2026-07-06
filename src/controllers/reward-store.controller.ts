import { Request, Response } from 'express';
import { RewardStoreService } from '../services/reward-store.service.js';
import { asyncHandler } from '../utils/async-handler.js';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const type = req.query.type as string | undefined;
  const categories = await RewardStoreService.listCategories(type);
  res.json(categories);
});

export const listAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await RewardStoreService.listAllCategories();
  res.json(categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await RewardStoreService.createCategory(req.body);
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await RewardStoreService.updateCategory(id, req.body);
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.deleteCategory(id);
  res.json(result);
});

export const archiveCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await RewardStoreService.archiveCategory(id);
  res.json(category);
});

// ---------------------------------------------------------------------------
// Items — public
// ---------------------------------------------------------------------------

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const rarity = req.query.rarity as string | undefined;
  const search = req.query.search as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const result = await RewardStoreService.listItems(
    req.user!.id, category, rarity, search, page, limit,
  );
  res.json(result);
});

export const getFeaturedItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await RewardStoreService.getFeaturedItems();
  res.json(items);
});

export const getRecentlyAdded = asyncHandler(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const items = await RewardStoreService.getRecentlyAdded(limit);
  res.json(items);
});

export const getSeasonalItems = asyncHandler(async (_req: Request, res: Response) => {
  const items = await RewardStoreService.getSeasonalItems();
  res.json(items);
});

export const getItemDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = await RewardStoreService.getItemDetail(id, req.user!.id);
  res.json(item);
});

// ---------------------------------------------------------------------------
// Purchase
// ---------------------------------------------------------------------------

export const purchaseItem = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.body;
  const result = await RewardStoreService.purchaseItem(itemId, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Purchase approval flow
// ---------------------------------------------------------------------------

export const requestPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.body;
  const result = await RewardStoreService.requestPurchase(itemId, req.user!.id);
  res.json(result);
});

export const approvePurchase = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.approvePurchase(id, req.user!.id);
  res.json(result);
});

export const rejectPurchase = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const result = await RewardStoreService.rejectPurchase(id, req.user!.id, reason);
  res.json(result);
});

export const cancelPurchase = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.cancelPurchase(id, req.user!.id);
  res.json(result);
});

export const getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
  const approvals = await RewardStoreService.getPendingApprovals(req.user!.id);
  res.json(approvals);
});

export const getChildApprovals = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.query.childId as string;
  if (childId) {
    const approvals = await RewardStoreService.getChildApprovals(childId);
    res.json(approvals);
    return;
  }
  const approvals = await RewardStoreService.getChildApprovals(req.user!.id);
  res.json(approvals);
});

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const categoryType = req.query.categoryType as string | undefined;
  const inventory = await RewardStoreService.getInventory(req.user!.id, categoryType);
  res.json(inventory);
});

export const getEquipped = asyncHandler(async (req: Request, res: Response) => {
  const items = await RewardStoreService.getEquipped(req.user!.id);
  res.json(items);
});

// ---------------------------------------------------------------------------
// Equip / Unequip
// ---------------------------------------------------------------------------

export const equipItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.equipItem(id, req.user!.id);
  res.json(result);
});

export const unequipItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.unequipItem(id, req.user!.id);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Gift
// ---------------------------------------------------------------------------

export const giftItem = asyncHandler(async (req: Request, res: Response) => {
  const { purchasedItemId, receiverId, message } = req.body;
  const result = await RewardStoreService.giftItem(purchasedItemId, req.user!.id, receiverId, message);
  res.json(result);
});

// ---------------------------------------------------------------------------
// Admin — item management
// ---------------------------------------------------------------------------

export const getAdminItems = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {
    category: req.query.category as string | undefined,
    rarity: req.query.rarity as string | undefined,
    isAvailable: req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined,
    isFeatured: req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined,
    search: req.query.search as string | undefined,
  };
  const result = await RewardStoreService.getAdminItems(page, limit, filter);
  res.json(result);
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await RewardStoreService.createItem({
    ...req.body,
    createdBy: req.user!.id,
  });
  res.status(201).json(item);
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = await RewardStoreService.updateItem(id, req.body);
  res.json(item);
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await RewardStoreService.deleteItem(id);
  res.json(result);
});

export const archiveItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = await RewardStoreService.archiveItem(id);
  res.json(item);
});

export const duplicateItem = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const item = await RewardStoreService.duplicateItem(id, req.user!.id);
  res.status(201).json(item);
});
