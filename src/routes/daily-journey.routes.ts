import { Router } from 'express';
import { DailyJourneyController } from '../controllers/daily-journey.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/today', DailyJourneyController.getTodayJourney);
router.post('/claim-gift', DailyJourneyController.claimDailyGift);
router.post('/mission-progress', DailyJourneyController.updateMissionProgress);
router.post('/claim-mission', DailyJourneyController.claimMissionReward);
router.post('/claim-challenge', DailyJourneyController.claimChallengeReward);
router.post('/show-surprise', DailyJourneyController.showSurprise);
router.post('/claim-surprise', DailyJourneyController.claimSurprise);
router.get('/history', DailyJourneyController.getHistory);
router.get('/stats', DailyJourneyController.getStats);

export default router;
