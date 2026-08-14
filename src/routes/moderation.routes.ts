import { Router } from 'express';
import { ModerationController } from '../controllers/moderation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ModerationController();

router.get('/stats', authenticate, ctrl.getStats);
router.get('/flagged', authenticate, ctrl.getFlaggedContent);
router.get('/', authenticate, ctrl.getReports);
router.get('/:id', authenticate, ctrl.getReportById);
router.post('/', authenticate, ctrl.createReport);
router.post('/:id/review', authenticate, ctrl.reviewReport);
router.post('/:id/resolve', authenticate, ctrl.resolveReport);
router.post('/:id/escalate', authenticate, ctrl.escalateReport);
router.post('/:id/dismiss', authenticate, ctrl.dismissReport);
router.get('/target/:targetType/:targetId', authenticate, ctrl.getReportsByTarget);
router.get('/:id/audit', authenticate, ctrl.getAuditTrail);

export default router;
