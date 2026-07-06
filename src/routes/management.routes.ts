import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import * as mgmtCtrl from '../controllers/management.controller.js';

const router = Router();

router.use(authenticate);

// ── Parent management ───────────────────────────────────────────────────────
router.get(
  '/parent/wallets',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  mgmtCtrl.getChildrenWallets,
);
router.get(
  '/parent/approvals',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.PARENT_APPROVE),
  mgmtCtrl.getFamilyPendingApprovals,
);
router.post(
  '/parent/notify',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  mgmtCtrl.sendFamilyNotification,
);
router.patch(
  '/parent/wallet/:childId/limit',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  mgmtCtrl.setWalletSpendingLimit,
);

// ── Teacher management ──────────────────────────────────────────────────────
router.get(
  '/teacher/students',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  mgmtCtrl.getTeacherStudentWallets,
);

// ── Admin management ─────────────────────────────────────────────────────────
router.get(
  '/admin/economy',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ECONOMY_VIEW),
  mgmtCtrl.getPlatformEconomyOverview,
);

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
