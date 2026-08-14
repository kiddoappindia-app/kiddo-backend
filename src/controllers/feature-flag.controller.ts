import { Request, Response } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service.js';

const service = new FeatureFlagService();

export class FeatureFlagController {
  async getFlags(req: Request, res: Response) {
    const { category } = req.query;
    const flags = await service.getFlags(category as string);
    res.json({ success: true, data: flags });
  }

  async getFlagByKey(req: Request, res: Response) {
    const flag = await service.getFlagByKey(req.params.key as string);
    res.json({ success: true, data: flag });
  }

  async createFlag(req: Request, res: Response) {
    const userId = (req as any).userId;
    const flag = await service.createFlag(req.body, userId);
    res.json({ success: true, data: flag });
  }

  async updateFlag(req: Request, res: Response) {
    const userId = (req as any).userId;
    const flag = await service.updateFlag(req.params.key as string, req.body, userId);
    res.json({ success: true, data: flag });
  }

  async toggleFlag(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { enabled } = req.body;
    const flag = await service.toggleFlag(req.params.key as string, enabled, userId);
    res.json({ success: true, data: flag });
  }

  async setRollout(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { percentage } = req.body;
    const flag = await service.setRollout(req.params.key as string, percentage, userId);
    res.json({ success: true, data: flag });
  }

  async deleteFlag(req: Request, res: Response) {
    await service.deleteFlag(req.params.key as string);
    res.json({ success: true });
  }

  async getClientFlags(req: Request, res: Response) {
    const { userId, schoolId, familyId } = req.query;
    const flags = await service.getEnabledFlags({ userId: userId as string, schoolId: schoolId as string, familyId: familyId as string });
    res.json({ success: true, data: flags });
  }

  async getChangeLog(req: Request, res: Response) {
    const log = await service.getChangeLog(req.params.key as string);
    res.json({ success: true, data: log });
  }
}
