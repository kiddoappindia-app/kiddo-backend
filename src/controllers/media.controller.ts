import { Request, Response } from 'express';
import { MediaService } from '../services/media.service.js';

const service = new MediaService();

export class MediaController {
  async getAssets(req: Request, res: Response) {
    const { type, category, page, limit } = req.query;
    const result = await service.getAssets(type as string, category as string, Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, ...result });
  }

  async getAssetById(req: Request, res: Response) {
    const asset = await service.getAssetById(req.params.id as string);
    res.json({ success: true, data: asset });
  }

  async createAsset(req: Request, res: Response) {
    const userId = (req as any).userId;
    const asset = await service.createAsset(req.body, userId);
    res.json({ success: true, data: asset });
  }

  async updateAsset(req: Request, res: Response) {
    const asset = await service.updateAsset(req.params.id as string, req.body);
    res.json({ success: true, data: asset });
  }

  async deleteAsset(req: Request, res: Response) {
    await service.deleteAsset(req.params.id as string);
    res.json({ success: true });
  }

  async getSignedUrl(req: Request, res: Response) {
    const { filename, expiresIn } = req.body;
    const result = await service.getSignedUrl(filename, expiresIn);
    res.json({ success: true, data: result });
  }

  async getAssetsByTags(req: Request, res: Response) {
    const { tags } = req.query;
    const assets = await service.getAssetsByTags((tags as string).split(','));
    res.json({ success: true, data: assets });
  }

  async getAssetsByCategory(req: Request, res: Response) {
    const assets = await service.getAssetsByCategory(req.params.category as string);
    res.json({ success: true, data: assets });
  }

  async createVersion(req: Request, res: Response) {
    const userId = (req as any).userId;
    const asset = await service.createVersion(req.params.id as string, req.body, userId);
    res.json({ success: true, data: asset });
  }

  async getVersions(req: Request, res: Response) {
    const versions = await service.getAssetVersions(req.params.id as string);
    res.json({ success: true, data: versions });
  }

  async searchAssets(req: Request, res: Response) {
    const { q } = req.query;
    const assets = await service.searchAssets(q as string);
    res.json({ success: true, data: assets });
  }

  async getPublicAssets(req: Request, res: Response) {
    const { category } = req.query;
    const assets = await service.getPublicAssets(category as string);
    res.json({ success: true, data: assets });
  }
}
