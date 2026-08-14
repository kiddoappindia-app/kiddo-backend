import { Request, Response } from 'express';
import { ContentVersionService } from '../services/content-version.service.js';

const service = new ContentVersionService();

export class ContentVersionController {
  async getVersions(req: Request, res: Response) {
    const versions = await service.getVersions(req.params.contentId as string);
    res.json({ success: true, data: versions });
  }

  async getVersion(req: Request, res: Response) {
    const version = await service.getVersion(req.params.contentId as string, Number(req.params.version));
    res.json({ success: true, data: version });
  }

  async createVersion(req: Request, res: Response) {
    const userId = (req as any).userId;
    const version = await service.createVersion(req.body, userId);
    res.json({ success: true, data: version });
  }

  async reviewVersion(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { approved, notes } = req.body;
    const version = await service.reviewVersion(req.params.contentId as string, Number(req.params.version), approved, userId, notes);
    res.json({ success: true, data: version });
  }

  async publishVersion(req: Request, res: Response) {
    const version = await service.publishVersion(req.params.contentId as string, Number(req.params.version));
    res.json({ success: true, data: version });
  }

  async getDraftVersions(_req: Request, res: Response) {
    const versions = await service.getDraftVersions();
    res.json({ success: true, data: versions });
  }

  async getReviewVersions(_req: Request, res: Response) {
    const versions = await service.getReviewVersions();
    res.json({ success: true, data: versions });
  }

  async revertToVersion(req: Request, res: Response) {
    const userId = (req as any).userId;
    const version = await service.revertToVersion(req.params.contentId as string, Number(req.params.version), userId);
    res.json({ success: true, data: version });
  }

  async deleteVersion(req: Request, res: Response) {
    await service.deleteVersion(req.params.contentId as string, Number(req.params.version));
    res.json({ success: true });
  }

  async getVersionStats(req: Request, res: Response) {
    const stats = await service.getVersionStats(req.params.contentId as string);
    res.json({ success: true, data: stats });
  }
}
