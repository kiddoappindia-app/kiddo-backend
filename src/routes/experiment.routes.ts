import { Router } from 'express';
import { ExperimentController } from '../controllers/experiment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new ExperimentController();

router.get('/', authenticate, ctrl.getExperiments);
router.get('/:id', authenticate, ctrl.getExperimentById);
router.post('/', authenticate, ctrl.createExperiment);
router.put('/:id', authenticate, ctrl.updateExperiment);
router.post('/:id/start', authenticate, ctrl.startExperiment);
router.post('/:id/pause', authenticate, ctrl.pauseExperiment);
router.post('/:id/complete', authenticate, ctrl.completeExperiment);
router.delete('/:id', authenticate, ctrl.deleteExperiment);
router.get('/:id/results', authenticate, ctrl.getResults);
router.get('/:id/assign', authenticate, ctrl.assignVariant);

export default router;
