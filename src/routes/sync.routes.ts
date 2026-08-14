import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:domain', authenticate, async (req, res) => {
  try {
    const domain = req.params.domain as string;
    const since = req.query.since as string | undefined;
    const familyId = (req as any).user.familyId;

    const validDomains = ['tasks', 'rewards', 'wallet', 'family', 'notifications', 'permissions'];
    if (!validDomains.includes(domain)) {
      return res.status(400).json({ error: 'Invalid domain' });
    }

    let data: any = {};
    const timestamp = new Date().toISOString();

    switch (domain) {
      case 'tasks':
        const tasks = await import('../models/task.model.js').then(m => m.Task);
        data = await tasks.find({ familyId, updatedAt: since ? { $gte: new Date(since) } : undefined }).lean();
        break;
      case 'rewards':
        const rewards = await import('../models/reward.model.js').then(m => m.Reward);
        data = await rewards.find({ familyId, updatedAt: since ? { $gte: new Date(since) } : undefined }).lean();
        break;
      case 'wallet':
        const wallet = await import('../models/wallet.model.js').then(m => m.Wallet);
        data = await wallet.find({ familyId }).lean();
        break;
      case 'family':
        const family = await import('../models/family.model.js').then(m => m.Family);
        data = await family.findById(familyId).lean();
        break;
      case 'notifications':
        data = [];
        break;
      case 'permissions':
        const permissions = await import('../models/user.model.js').then(m => m.User);
        data = await permissions.find({ familyId, role: 'child' }).select('permissions age birthday').lean();
        break;
    }

    res.json({
      success: true,
      data,
      timestamp,
      domain,
    });
  } catch (error) {
    console.error(`Sync error for domain ${req.params.domain}:`, error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const familyId = (req as any).user.familyId;
    const domains = ['tasks', 'rewards', 'wallet', 'family', 'notifications', 'permissions'];
    const syncData: Record<string, any> = {};

    for (const domain of domains) {
      try {
        let data: any;
        switch (domain) {
          case 'tasks':
            const tasks = await import('../models/task.model.js').then(m => m.Task);
            data = await tasks.find({ familyId }).lean();
            break;
          case 'rewards':
            const rewards = await import('../models/reward.model.js').then(m => m.Reward);
            data = await rewards.find({ familyId }).lean();
            break;
          case 'wallet':
            const wallet = await import('../models/wallet.model.js').then(m => m.Wallet);
            data = await wallet.find({ familyId }).lean();
            break;
          case 'family':
            const family = await import('../models/family.model.js').then(m => m.Family);
            data = await family.findById(familyId).lean();
            break;
          case 'notifications':
            data = [];
            break;
          case 'permissions':
            const permissions = await import('../models/user.model.js').then(m => m.User);
            data = await permissions.find({ familyId, role: 'child' }).select('permissions age birthday').lean();
            break;
        }
        syncData[domain] = data;
      } catch (error) {
        console.error(`Sync error for domain ${domain}:`, error);
        syncData[domain] = null;
      }
    }

    res.json({
      success: true,
      data: syncData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Full sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
