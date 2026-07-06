import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as walletCtrl from '../controllers/wallet.controller.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/me', walletCtrl.getMyWallet);
router.get('/transactions', walletCtrl.getTransactions);
router.get('/conversions', walletCtrl.getConversions);
router.post('/reward', authorize(ROLES.CHILD, ROLES.PARENT, ROLES.TEACHER, ROLES.ADMIN), walletCtrl.awardPoints);
router.post('/convert', authorize(ROLES.CHILD), walletCtrl.convertPoints);
router.post('/convert/request', authorize(ROLES.CHILD), walletCtrl.requestConversion);
router.post('/conversions/:id/approve', authorize(ROLES.PARENT, ROLES.ADMIN), walletCtrl.approveConversion);
router.post('/conversions/:id/reject', authorize(ROLES.PARENT, ROLES.ADMIN), walletCtrl.rejectConversion);
router.get('/conversions/pending', authorize(ROLES.PARENT, ROLES.ADMIN), walletCtrl.getPendingConversions);
router.post('/gift/points', authorize(ROLES.PARENT, ROLES.TEACHER, ROLES.ADMIN), walletCtrl.giftPoints);
router.post('/gift/coins', authorize(ROLES.PARENT, ROLES.ADMIN), walletCtrl.giftCoins);
router.post('/spend', authorize(ROLES.CHILD), walletCtrl.spendCoins);
router.get('/child/:childId', authorize(ROLES.PARENT, ROLES.ADMIN), walletCtrl.getChildWallet);

export default router;
