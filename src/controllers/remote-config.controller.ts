import { Request, Response } from 'express';
import { RemoteConfigService } from '../services/remote-config.service.js';

const service = new RemoteConfigService();

export class RemoteConfigController {
  async getConfigs(_req: Request, res: Response) {
    const { category } = _req.query;
    const configs = category ? await service.getConfigsByCategory(category as string) : await service.getAllConfigs();
    res.json({ success: true, data: configs });
  }

  async getConfig(req: Request, res: Response) {
    const config = await service.getConfig(req.params.key as string);
    res.json({ success: true, data: config });
  }

  async setConfig(req: Request, res: Response) {
    const userId = (req as any).userId;
    const config = await service.setConfig(req.body, userId);
    res.json({ success: true, data: config });
  }

  async deleteConfig(req: Request, res: Response) {
    await service.deleteConfig(req.params.key as string);
    res.json({ success: true });
  }

  async getChangeLog(req: Request, res: Response) {
    const log = await service.getChangeLog(req.params.key as string);
    res.json({ success: true, data: log });
  }

  async getClientConfig(req: Request, res: Response) {
    const { version } = req.query;
    const config = await service.getClientConfig(version as string);
    res.json({ success: true, data: config });
  }
}
