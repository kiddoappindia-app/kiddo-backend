import { Router } from 'express';
import { EventConfigController } from '../controllers/event-config.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new EventConfigController();

router.get('/', authenticate, ctrl.getEvents);
router.get('/active', ctrl.getActiveEvents);
router.get('/upcoming', ctrl.getUpcoming);
router.get('/:id', authenticate, ctrl.getEventById);
router.post('/', authenticate, ctrl.createEvent);
router.put('/:id', authenticate, ctrl.updateEvent);
router.post('/:id/activate', authenticate, ctrl.activateEvent);
router.post('/:id/end', authenticate, ctrl.endEvent);
router.post('/:id/archive', authenticate, ctrl.archiveEvent);
router.delete('/:id', authenticate, ctrl.deleteEvent);

export default router;
