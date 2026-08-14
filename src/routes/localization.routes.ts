import { Router } from 'express';
import { LocalizationController } from '../controllers/localization.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new LocalizationController();

router.get('/', authenticate, ctrl.getLocales);
router.get('/code/:locale', ctrl.getLocaleByCode);
router.get('/:id', authenticate, ctrl.getLocaleById);
router.post('/', authenticate, ctrl.createLocale);
router.put('/:id', authenticate, ctrl.updateLocale);
router.post('/:id/publish', authenticate, ctrl.publishLocale);
router.delete('/:id', authenticate, ctrl.deleteLocale);
router.get('/:locale/translations', ctrl.getTranslations);
router.put('/:locale/translations', authenticate, ctrl.updateTranslation);
router.post('/:locale/translations/bulk', authenticate, ctrl.bulkUpdateTranslations);
router.get('/:locale/stats', authenticate, ctrl.getCompletionStats);

export default router;
