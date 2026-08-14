import { Request, Response } from 'express';
import { WorldMapEngineService } from '../services/world-map-engine.service.js';

export class WorldMapController {
  static async getAllAreas(req: Request, res: Response) {
    try {
      const areas = await WorldMapEngineService.getAllAreas();
      res.json(areas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getArea(req: Request, res: Response) {
    try {
      const areaId = req.params.areaId as string;
      const area = await WorldMapEngineService.getArea(areaId);
      if (!area) return res.status(404).json({ message: 'Area not found' });
      res.json(area);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMyProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const progress = await WorldMapEngineService.getChildProgress(userId);
      res.json(progress);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async travel(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { areaId } = req.body;
      const progress = await WorldMapEngineService.travelToArea(userId, areaId);
      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async collectCollectible(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { areaId, collectibleId } = req.body;
      const result = await WorldMapEngineService.collectCollectible(userId, areaId, collectibleId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async interactNpc(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { areaId, npcId } = req.body;
      const npc = await WorldMapEngineService.interactWithNpc(userId, areaId, npcId);
      res.json(npc);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getWorldStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const stats = await WorldMapEngineService.getWorldStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
