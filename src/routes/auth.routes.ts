import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema, parentRegisterSchema, childCreateSchema, childCodeLoginSchema, googleMobileLoginSchema, firebaseAuthSchema } from '../schemas/auth.schema.js';
import { ROLES } from '../constants/roles.js';
import { z } from 'zod';

const router = Router();

// Registration & Login
router.post('/parent/register', validate(parentRegisterSchema), authController.registerParent);
router.post('/login', validate(loginSchema), authController.login);
router.post('/children/login', validate(childCodeLoginSchema), authController.childCodeLogin);
router.post('/children/pin-login', authController.childPinLogin);
router.post('/google/mobile', validate(googleMobileLoginSchema), authController.googleMobileLogin);
router.post('/firebase', validate(firebaseAuthSchema), authController.firebaseLogin);

// Profile
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, authController.changePassword);

// Child Management (Parent only)
router.post(
  '/children',
  authenticate,
  authorize(ROLES.PARENT),
  validate(childCreateSchema),
  authController.createChild,
);

router.patch(
  '/children/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  authController.updateChildProfile,
);

router.delete(
  '/children/:childId',
  authenticate,
  authorize(ROLES.PARENT),
  authController.deleteChild,
);

router.post(
  '/children/:childId/archive',
  authenticate,
  authorize(ROLES.PARENT),
  authController.archiveChild,
);

router.post(
  '/children/:childId/disable-login',
  authenticate,
  authorize(ROLES.PARENT),
  authController.disableChildLogin,
);

router.post(
  '/children/:childId/transfer',
  authenticate,
  authorize(ROLES.PARENT),
  authController.transferChild,
);

// PIN Management
router.post(
  '/children/:childId/pin',
  authenticate,
  authorize(ROLES.PARENT),
  authController.setChildPin,
);

router.post(
  '/children/:childId/pin/reset',
  authenticate,
  authorize(ROLES.PARENT),
  authController.resetChildPin,
);

// Session Management
router.post('/refresh', authController.refresh);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
router.delete('/sessions', authenticate, authController.revokeAllSessions);

export default router;
