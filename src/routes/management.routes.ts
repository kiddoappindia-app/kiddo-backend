import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import * as mgmtCtrl from '../controllers/management.controller.js';

const router = Router();

router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════════
// PARENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ── Wallet overview & detail ────────────────────────────────────────────────
router.get(
  '/parent/wallets',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_VIEW),
  mgmtCtrl.getChildrenWallets,
);
router.get(
  '/parent/wallets/:childId',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_VIEW),
  mgmtCtrl.getChildWalletDetail,
);

// ── Reward & coin history ───────────────────────────────────────────────────
router.get(
  '/parent/wallets/:childId/rewards',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.REWARD_VIEW),
  mgmtCtrl.getChildRewardHistory,
);
router.get(
  '/parent/wallets/:childId/coins',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.TRANSACTION_VIEW),
  mgmtCtrl.getChildCoinHistory,
);

// ── Approval workflow ───────────────────────────────────────────────────────
router.get(
  '/parent/approvals',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.PARENT_APPROVE),
  mgmtCtrl.getFamilyPendingApprovals,
);
router.post(
  '/parent/conversions/:id/approve',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.CONVERSION_APPROVE),
  mgmtCtrl.approveConversion,
);
router.post(
  '/parent/conversions/:id/reject',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.CONVERSION_REJECT),
  mgmtCtrl.rejectConversion,
);
router.post(
  '/parent/purchases/:id/approve',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.PURCHASE_APPROVE),
  mgmtCtrl.approvePurchase,
);
router.post(
  '/parent/purchases/:id/reject',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.PURCHASE_REJECT),
  mgmtCtrl.rejectPurchase,
);

// ── Gift rewards ────────────────────────────────────────────────────────────
router.post(
  '/parent/gift/points',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.REWARD_GIFT),
  mgmtCtrl.giftRewardPoints,
);
router.post(
  '/parent/gift/coins',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_GIFT),
  mgmtCtrl.giftRedeemCoins,
);

// ── Custom rewards ──────────────────────────────────────────────────────────
router.get(
  '/parent/custom-rewards',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.REWARD_VIEW),
  mgmtCtrl.getCustomRewards,
);
router.post(
  '/parent/custom-rewards',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.CUSTOM_REWARD_CREATE),
  mgmtCtrl.createCustomReward,
);
router.patch(
  '/parent/custom-rewards/:rewardId',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.CUSTOM_REWARD_EDIT),
  mgmtCtrl.updateCustomReward,
);
router.delete(
  '/parent/custom-rewards/:rewardId',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.CUSTOM_REWARD_DELETE),
  mgmtCtrl.deleteCustomReward,
);
router.patch(
  '/parent/custom-rewards/:rewardId/disable',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.CUSTOM_REWARD_DISABLE),
  mgmtCtrl.disableCustomReward,
);

// ── Wallet freeze / unfreeze ────────────────────────────────────────────────
router.post(
  '/parent/wallet/:childId/freeze',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_FREEZE),
  mgmtCtrl.freezeWallet,
);
router.post(
  '/parent/wallet/:childId/unfreeze',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_FREEZE),
  mgmtCtrl.unfreezeWallet,
);

// ── Wallet spending limits & policy ─────────────────────────────────────────
router.patch(
  '/parent/wallet/:childId/limit',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_SPENDING_LIMIT),
  mgmtCtrl.setWalletSpendingLimit,
);
router.patch(
  '/parent/wallet/:childId/policy',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_SPENDING_LIMIT),
  mgmtCtrl.configureWalletPolicy,
);
router.get(
  '/parent/wallet/:childId/policy',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_VIEW),
  mgmtCtrl.getWalletPolicy,
);

// ── Analytics ───────────────────────────────────────────────────────────────
router.get(
  '/parent/wallets/:childId/analytics/weekly',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_FAMILY),
  mgmtCtrl.getWeeklyAnalytics,
);
router.get(
  '/parent/wallets/:childId/analytics/monthly',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_FAMILY),
  mgmtCtrl.getMonthlyAnalytics,
);
router.get(
  '/parent/wallets/:childId/analytics/spending',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_FAMILY),
  mgmtCtrl.getSpendingAnalytics,
);
router.get(
  '/parent/wallets/:childId/analytics/growth',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_FAMILY),
  mgmtCtrl.getWalletGrowth,
);
router.get(
  '/parent/wallets/:childId/analytics/gifts',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_FAMILY),
  mgmtCtrl.getGiftHistory,
);

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/teacher/students',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  requirePermission(PERMISSIONS.TEACHER_REWARD),
  mgmtCtrl.getTeacherStudentWallets,
);
router.get(
  '/teacher/students/:studentId/wallet',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  requirePermission(PERMISSIONS.WALLET_VIEW),
  mgmtCtrl.getStudentWallet,
);
router.get(
  '/teacher/students/:studentId/rewards',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  requirePermission(PERMISSIONS.REWARD_VIEW),
  mgmtCtrl.getStudentRewardHistory,
);
router.get(
  '/teacher/leaderboard',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  requirePermission(PERMISSIONS.LEADERBOARD_VIEW),
  mgmtCtrl.getClassLeaderboard,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ── Economy ─────────────────────────────────────────────────────────────────
router.get(
  '/admin/economy',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ECONOMY_VIEW),
  mgmtCtrl.getPlatformEconomyOverview,
);
router.get(
  '/admin/analytics',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  mgmtCtrl.getPlatformRewardAnalytics,
);

// ── Reward rules ────────────────────────────────────────────────────────────
router.get(
  '/admin/rules',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.REWARD_RULE_MANAGE),
  mgmtCtrl.listRewardRules,
);
router.get(
  '/admin/rules/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.REWARD_RULE_MANAGE),
  mgmtCtrl.getRewardRule,
);

// ── Settings ────────────────────────────────────────────────────────────────
router.get(
  '/admin/settings',
  authorize(ROLES.ADMIN),
  mgmtCtrl.listSettings,
);
router.get(
  '/admin/settings/:key',
  authorize(ROLES.ADMIN),
  mgmtCtrl.getSetting,
);
router.patch(
  '/admin/settings/:key',
  authorize(ROLES.ADMIN),
  mgmtCtrl.updateSetting,
);

// ── Notifications ───────────────────────────────────────────────────────────
router.post(
  '/admin/notifications/send',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.NOTIFICATION_SEND),
  mgmtCtrl.sendNotification,
);
router.post(
  '/admin/notifications/bulk',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.NOTIFICATION_MANAGE),
  mgmtCtrl.sendBulkNotification,
);

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED / CROSS-ROLE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Notification preferences ────────────────────────────────────────────────
router.get(
  '/notifications/preferences',
  mgmtCtrl.getNotificationPreferences,
);
router.patch(
  '/notifications/preferences',
  mgmtCtrl.updateNotificationPreferences,
);

export default router;
