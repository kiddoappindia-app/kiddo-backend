import { Router } from 'express';
import { AchievementController, StreakController, AnalyticsController } from '../controllers/gamification-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/achievements', AchievementController.getAchievements);
router.get('/achievements/:childId', AchievementController.getChildAchievements);
router.get('/achievements/:childId/progress', AchievementController.getAchievementProgress);
router.post('/achievements/:childId/:achievementId/claim', AchievementController.claimAchievement);
router.get('/achievements/:childId/unclaimed', AchievementController.getUnclaimedCount);
router.post('/achievements/:childId/check', AchievementController.checkAchievements);

router.get('/streaks/:childId', StreakController.getStreaks);
router.get('/streaks/:childId/stats', StreakController.getStreakStats);
router.post('/streaks/:childId/increment', StreakController.incrementStreak);
router.get('/streaks/:childId/history', StreakController.getStreakHistory);

router.get('/analytics/child/:childId', AnalyticsController.getChildAnalytics);
router.get('/analytics/family', AnalyticsController.getFamilyAnalytics);
router.get('/analytics/habits/:childId', AnalyticsController.getHabitIntelligence);
router.post('/analytics/snapshot/:childId', AnalyticsController.generateSnapshot);

export default router;
