import { Router } from 'express';
import * as permissionController from '../controllers/permission.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get(
  '/children',
  authenticate,
  authorize(ROLES.PARENT),
  permissionController.getAllPermissions,
);

router.get(
  '/children/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  permissionController.getPermissions,
);

router.patch(
  '/children/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  permissionController.updatePermissions,
);

export default router;
