import { Router } from 'express';
import { AnalyticsOpsController } from '../controllers/analytics-ops.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new AnalyticsOpsController();

router.post('/track', authenticate, ctrl.trackDaily);
router.get('/daily', authenticate, ctrl.getDailySummary);
router.get('/weekly', authenticate, ctrl.getWeeklySummary);
router.get('/monthly', authenticate, ctrl.getMonthlySummary);
router.get('/trend', authenticate, ctrl.getTrend);
router.get('/dau-trend', authenticate, ctrl.getDAUTrend);
router.get('/retention', authenticate, ctrl.getRetentionTrend);
router.post('/aggregate/week', authenticate, ctrl.aggregateWeek);
router.post('/aggregate/month', authenticate, ctrl.aggregateMonth);

export default router;
