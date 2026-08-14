import { Router } from 'express';
import * as pairingController from '../controllers/pairing.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post(
  '/code/generate',
  authenticate,
  authorize(ROLES.PARENT),
  pairingController.generateCode,
);

router.post(
  '/qr/generate',
  authenticate,
  authorize(ROLES.PARENT),
  pairingController.generateQr,
);

router.post(
  '/code/validate',
  authenticate,
  authorize(ROLES.CHILD),
  pairingController.validateCode,
);

router.post(
  '/qr/validate',
  authenticate,
  authorize(ROLES.CHILD),
  pairingController.validateQr,
);

router.post(
  '/revoke',
  authenticate,
  authorize(ROLES.PARENT),
  pairingController.revokeAll,
);

router.get(
  '/active',
  authenticate,
  authorize(ROLES.PARENT),
  pairingController.getActiveTokens,
);

export default router;
