import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as storeCtrl from '../controllers/reward-store.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

// ── Categories (public) ──────────────────────────────────────────────────────
router.get('/categories', storeCtrl.listCategories);
router.get('/categories/all', storeCtrl.listAllCategories);

// ── Items (public) ───────────────────────────────────────────────────────────
router.get('/items', storeCtrl.listItems);
router.get('/items/featured', storeCtrl.getFeaturedItems);
router.get('/items/recent', storeCtrl.getRecentlyAdded);
router.get('/items/seasonal', storeCtrl.getSeasonalItems);
router.get('/items/:id', storeCtrl.getItemDetail);

// ── Purchase & approval ──────────────────────────────────────────────────────
router.post('/purchase', authorize(ROLES.CHILD), storeCtrl.purchaseItem);
router.post('/purchase/request', authorize(ROLES.CHILD), storeCtrl.requestPurchase);
router.post('/approvals/:id/approve', authorize(ROLES.PARENT), storeCtrl.approvePurchase);
router.post('/approvals/:id/reject', authorize(ROLES.PARENT), storeCtrl.rejectPurchase);
router.post('/approvals/:id/cancel', authorize(ROLES.CHILD), storeCtrl.cancelPurchase);
router.get('/approvals/pending', authorize(ROLES.PARENT, ROLES.ADMIN), storeCtrl.getPendingApprovals);
router.get('/approvals', authorize(ROLES.CHILD, ROLES.PARENT), storeCtrl.getChildApprovals);

// ── Inventory ────────────────────────────────────────────────────────────────
router.get('/inventory', storeCtrl.getInventory);
router.get('/inventory/equipped', storeCtrl.getEquipped);

// ── Equip / Unequip ──────────────────────────────────────────────────────────
router.post('/inventory/:id/equip', authorize(ROLES.CHILD), storeCtrl.equipItem);
router.post('/inventory/:id/unequip', authorize(ROLES.CHILD), storeCtrl.unequipItem);

// ── Gift ─────────────────────────────────────────────────────────────────────
router.post('/gift', authorize(ROLES.PARENT, ROLES.TEACHER, ROLES.ADMIN), storeCtrl.giftItem);

// ── Admin: categories ────────────────────────────────────────────────────────
router.post('/categories', authorize(ROLES.ADMIN), storeCtrl.createCategory);
router.patch('/categories/:id', authorize(ROLES.ADMIN), storeCtrl.updateCategory);
router.delete('/categories/:id', authorize(ROLES.ADMIN), storeCtrl.deleteCategory);
router.post('/categories/:id/archive', authorize(ROLES.ADMIN), storeCtrl.archiveCategory);

// ── Admin: items ─────────────────────────────────────────────────────────────
router.get('/admin/items', authorize(ROLES.ADMIN), storeCtrl.getAdminItems);
router.post('/items', authorize(ROLES.ADMIN), storeCtrl.createItem);
router.patch('/items/:id', authorize(ROLES.ADMIN), storeCtrl.updateItem);
router.delete('/items/:id', authorize(ROLES.ADMIN), storeCtrl.deleteItem);
router.post('/items/:id/archive', authorize(ROLES.ADMIN), storeCtrl.archiveItem);
router.post('/items/:id/duplicate', authorize(ROLES.ADMIN), storeCtrl.duplicateItem);

export default router;
