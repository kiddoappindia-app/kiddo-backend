import { Router } from 'express';
import { MediaController } from '../controllers/media.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();
const ctrl = new MediaController();

router.get('/public', ctrl.getPublicAssets);
router.get('/search', authenticate, ctrl.searchAssets);
router.get('/', authenticate, ctrl.getAssets);
router.get('/:id', authenticate, ctrl.getAssetById);
router.post('/', authenticate, ctrl.createAsset);
router.put('/:id', authenticate, ctrl.updateAsset);
router.delete('/:id', authenticate, ctrl.deleteAsset);
router.post('/signed-url', authenticate, ctrl.getSignedUrl);
router.get('/tags/:tags', authenticate, ctrl.getAssetsByTags);
router.get('/category/:category', authenticate, ctrl.getAssetsByCategory);
router.post('/:id/versions', authenticate, ctrl.createVersion);
router.get('/:id/versions', authenticate, ctrl.getVersions);

export default router;
