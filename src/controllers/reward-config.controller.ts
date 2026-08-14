import { Request, Response } from 'express';
import { RewardConfigService } from '../services/reward-config.service.js';

const service = new RewardConfigService();

export class RewardConfigController {
  async getConfigs(req: Request, res: Response) {
    const { category } = req.query;
    const configs = await service.getConfigs(category as string);
    res.json({ success: true, data: configs });
  }

  async getConfigByKey(req: Request, res: Response) {
    const config = await service.getConfigByKey(req.params.key as string);
    res.json({ success: true, data: config });
  }

  async createConfig(req: Request, res: Response) {
    const userId = (req as any).userId;
    const config = await service.createConfig(req.body, userId);
    res.json({ success: true, data: config });
  }

  async updateConfig(req: Request, res: Response) {
    const userId = (req as any).userId;
    const config = await service.updateConfig(req.params.key as string, req.body, userId);
    res.json({ success: true, data: config });
  }

  async deleteConfig(req: Request, res: Response) {
    await service.deleteConfig(req.params.key as string);
    res.json({ success: true });
  }

  async toggleConfig(req: Request, res: Response) {
    const { enabled } = req.body;
    const config = await service.toggleConfig(req.params.key as string, enabled);
    res.json({ success: true, data: config });
  }

  async calculateReward(req: Request, res: Response) {
    const result = await service.calculateReward(req.params.key as string, req.body);
    res.json({ success: true, data: result });
  }

  async getActive(_req: Request, res: Response) {
    const configs = await service.getActiveConfigs();
    res.json({ success: true, data: configs });
  }
}
