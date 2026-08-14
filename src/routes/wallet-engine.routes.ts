import { Router } from 'express';
import { WalletController } from '../controllers/wallet-engine.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:childId', WalletController.getBalance);
router.get('/:childId/transactions', WalletController.getTransactionHistory);
router.get('/:childId/summary', WalletController.getTransactionSummary);
router.post('/:childId/credit', WalletController.credit);
router.post('/:childId/debit', WalletController.debit);
router.post('/:childId/adjust', WalletController.adjust);

export default router;
