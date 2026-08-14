import { Router } from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post(
  '/:childId/register',
  authenticate,
  authorize(ROLES.CHILD),
  deviceController.register,
);

router.get(
  '/:childId',
  authenticate,
  authorize(ROLES.PARENT, ROLES.CHILD),
  deviceController.list,
);

router.patch(
  '/:deviceId/rename/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  deviceController.rename,
);

router.delete(
  '/:deviceId/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  deviceController.remove,
);

router.post(
  '/:deviceId/force-logout/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  deviceController.forceLogout,
);

export default router;
