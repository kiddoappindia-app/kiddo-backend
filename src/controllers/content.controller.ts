import { Request, Response } from 'express';
import { ContentService } from '../services/content.service.js';

const service = new ContentService();

export class ContentController {
  async getContent(req: Request, res: Response) {
    const { type } = req.params;
    const { status, page, limit } = req.query;
    const result = await service.getContent(type as string, status as string, Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, ...result });
  }

  async getContentById(req: Request, res: Response) {
    const item = await service.getContentById(req.params.id as string);
    res.json({ success: true, data: item });
  }

  async createContent(req: Request, res: Response) {
    const userId = (req as any).userId;
    const item = await service.createContent(req.body, userId);
    res.json({ success: true, data: item });
  }

  async updateContent(req: Request, res: Response) {
    const userId = (req as any).userId;
    const item = await service.updateContent(req.params.id as string, req.body, userId);
    res.json({ success: true, data: item });
  }

  async publishContent(req: Request, res: Response) {
    const userId = (req as any).userId;
    const item = await service.publishContent(req.params.id as string, userId);
    res.json({ success: true, data: item });
  }

  async archiveContent(req: Request, res: Response) {
    const item = await service.archiveContent(req.params.id as string);
    res.json({ success: true, data: item });
  }

  async deleteContent(req: Request, res: Response) {
    await service.deleteContent(req.params.id as string);
    res.json({ success: true });
  }

  async getVersions(req: Request, res: Response) {
    const versions = await service.getContentVersions(req.params.id as string);
    res.json({ success: true, data: versions });
  }

  async revertToVersion(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { version } = req.body;
    const item = await service.revertToVersion(req.params.id as string, version, userId);
    res.json({ success: true, data: item });
  }

  async searchContent(req: Request, res: Response) {
    const { q, type } = req.query;
    const results = await service.searchContent(q as string, type as string);
    res.json({ success: true, data: results });
  }
}
