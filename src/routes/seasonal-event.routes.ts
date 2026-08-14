import { Router } from 'express';
import { SeasonalEventController } from '../controllers/seasonal-event.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/active', SeasonalEventController.getActiveEvents);
router.get('/upcoming', SeasonalEventController.getUpcomingEvents);

router.use(authenticate);

router.post('/participate', SeasonalEventController.participate);
router.post('/check-in', SeasonalEventController.checkIn);
router.post('/claim-reward', SeasonalEventController.claimReward);
router.get('/my-participations', SeasonalEventController.getMyParticipation);

export default router;
