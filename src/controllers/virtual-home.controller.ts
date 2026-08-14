import { Request, Response } from 'express';
import { VirtualHomeEngineService } from '../services/virtual-home-engine.service.js';

export class VirtualHomeController {
  static async getHome(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const home = await VirtualHomeEngineService.getHome(userId);
      res.json(home);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getFurnitureItems(req: Request, res: Response) {
    try {
      const { category, roomType, rarity } = req.query;
      const items = await VirtualHomeEngineService.getFurnitureItems({
        category: category as string,
        roomType: roomType as string,
        rarity: rarity as string,
      });
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async placeFurniture(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { roomId, furnitureId, position } = req.body;
      const home = await VirtualHomeEngineService.placeFurniture(userId, roomId, furnitureId, position);
      res.json(home);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async removeFurniture(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const roomId = req.params.roomId as string;
      const furnitureId = req.params.furnitureId as string;
      const home = await VirtualHomeEngineService.removeFurniture(userId, roomId, furnitureId);
      res.json(home);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async unlockRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { roomType } = req.body;
      const home = await VirtualHomeEngineService.unlockRoom(userId, roomType);
      res.json(home);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async renameHome(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name } = req.body;
      const home = await VirtualHomeEngineService.renameHome(userId, name);
      res.json(home);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getHomeStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const stats = await VirtualHomeEngineService.getHomeStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
