import { Router } from 'express';
import * as controller from '../controllers/intelligence.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Events
router.post('/events', controller.trackEvent);
router.get('/events', controller.getEvents);
router.get('/events/counts', controller.getEventCounts);
router.get('/events/timeline', controller.getTimeline);

// Growth
router.get('/growth/:userId', controller.getGrowthProfile);
router.get('/growth/timeline', controller.getGrowthTimeline);
router.get('/growth/dimension/:dimension', controller.getDimensionTrend);

// Habits
router.get('/habits', controller.analyzeHabits);
router.get('/habits/:habitType/trends', controller.getHabitTrends);
router.get('/habits/emerging', controller.getEmergingHabits);
router.get('/habits/declining', controller.getDecliningHabits);

// Insights
router.get('/insights', controller.getInsights);
router.post('/insights/:insightId/acknowledge', controller.acknowledgeInsight);
router.post('/insights/evaluate', controller.evaluateRules);

// Trends
router.get('/trends/tasks', controller.getTaskTrend);
router.get('/trends/homework', controller.getHomeworkTrend);
router.get('/trends/attendance', controller.getAttendanceTrend);
router.get('/trends/reading', controller.getReadingTrend);

// Reports
router.post('/reports/parent-weekly/:userId', controller.generateParentWeeklyReport);
router.get('/reports', controller.getReports);
router.get('/reports/:reportId', controller.getReport);

// Summaries
router.get('/summaries/daily', controller.getDailySummaries);
router.get('/summaries/weekly', controller.getWeeklySummaries);
router.get('/summaries/monthly', controller.getMonthlySummaries);

export default router;
