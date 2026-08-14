import { Router } from 'express';
import { TaskController, TaskTemplateController } from '../controllers/task-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', TaskController.createTask);
router.get('/', TaskController.getTasks);
router.get('/child/:childId', TaskController.getChildTasks);
router.get('/:taskId', TaskController.getTask);
router.put('/:taskId', TaskController.updateTask);
router.delete('/:taskId', TaskController.deleteTask);
router.post('/:taskId/complete', TaskController.completeTask);
router.get('/:taskId/completions', TaskController.getCompletions);
router.post('/completions/:completionId/approve', TaskController.approveTask);
router.get('/preview/reward', TaskController.getTaskPreview);
router.post('/bulk-assign', TaskController.bulkAssign);
router.post('/archive-old', TaskController.archiveOldTasks);

export default router;
