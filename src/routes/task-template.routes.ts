import { Router } from 'express';
import { TaskTemplateController } from '../controllers/task-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', TaskTemplateController.createTemplate);
router.get('/', TaskTemplateController.getTemplates);
router.put('/:templateId', TaskTemplateController.updateTemplate);
router.delete('/:templateId', TaskTemplateController.deleteTemplate);
router.post('/:templateId/create-task', TaskTemplateController.createTaskFromTemplate);

export default router;
