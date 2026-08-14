import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { Device } from '../models/device.model.js';

const router = Router();

router.post('/heartbeat', authenticate, async (req, res) => {
  try {
    const { deviceId, timestamp } = req.body;
    const userId = (req as any).user.id;

    if (deviceId) {
      await Device.findOneAndUpdate(
        { deviceId, userId },
        { lastActiveAt: new Date(timestamp || Date.now()), isOnline: true },
      );
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

router.get('/devices', authenticate, async (req, res) => {
  try {
    const familyId = (req as any).user.familyId;

    const devices = await Device.find({ familyId, isActive: true })
      .sort({ lastActiveAt: -1 })
      .lean();

    const now = new Date();
    const enrichedDevices = devices.map((device: any) => {
      const lastActive = new Date(device.lastActiveAt);
      const minutesSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / 60000);

      return {
        ...device,
        isRecentlyActive: minutesSinceActive < 5,
        lastActiveDisplay: minutesSinceActive < 1
          ? 'Just now'
          : minutesSinceActive < 60
            ? `${minutesSinceActive}m ago`
            : minutesSinceActive < 1440
              ? `${Math.floor(minutesSinceActive / 60)}h ago`
              : `${Math.floor(minutesSinceActive / 1440)}d ago`,
      };
    });

    res.json({
      success: true,
      data: enrichedDevices,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

router.get('/online', authenticate, async (req, res) => {
  try {
    const familyId = (req as any).user.familyId;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineDevices = await Device.find({
      familyId,
      isActive: true,
      lastActiveAt: { $gte: fiveMinutesAgo },
    })
      .sort({ lastActiveAt: -1 })
      .lean();

    res.json({
      success: true,
      data: onlineDevices,
      count: onlineDevices.length,
    });
  } catch (error) {
    console.error('Get online devices error:', error);
    res.status(500).json({ error: 'Failed to get online devices' });
  }
});

export default router;
