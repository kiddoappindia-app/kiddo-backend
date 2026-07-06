import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import * as analyticsExtCtrl from '../controllers/analytics-ext.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

// ── Family analytics (parent/admin) ─────────────────────────────────────────
router.get(
  '/family',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  analyticsController.getFamilyAnalytics,
);

// ── Parent analytics ────────────────────────────────────────────────────────
router.get(
  '/parent/spending',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_FAMILY),
  analyticsExtCtrl.getChildSpending,
);
router.get(
  '/parent/wallet-growth/:childId',
  authorize(ROLES.PARENT, ROLES.ADMIN),
  analyticsExtCtrl.getChildWalletGrowth,
);

// ── Teacher analytics ───────────────────────────────────────────────────────
router.get(
  '/teacher/top-students',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  analyticsExtCtrl.getTopStudents,
);
router.get(
  '/teacher/class-activity',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  analyticsExtCtrl.getClassActivity,
);

// ── Admin analytics ─────────────────────────────────────────────────────────
router.get(
  '/admin/conversion-trends',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ECONOMY_VIEW),
  analyticsExtCtrl.getConversionTrends,
);
router.get(
  '/admin/approval-stats',
  authorize(ROLES.ADMIN),
  analyticsExtCtrl.getApprovalStats,
);

export default router;
