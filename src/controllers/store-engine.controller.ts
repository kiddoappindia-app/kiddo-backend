import { Request, Response } from 'express';
import { StoreEngine } from '../services/store-engine.service.js';

export class StoreController {
  static async getItems(req: Request, res: Response) {
    try {
      const items = await StoreEngine.getStoreItems(
        (req as any).user.familyId,
        req.query.type as string,
      );
      res.json({ success: true, data: items });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createItem(req: Request, res: Response) {
    try {
      const item = await StoreEngine.createItem({
        ...req.body,
        createdBy: (req as any).user.id,
        familyId: (req as any).user.familyId,
      });
      res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      const itemId = req.params.itemId as string;
      const item = await StoreEngine.updateItem(itemId, req.body);
      res.json({ success: true, data: item });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async requestRedemption(req: Request, res: Response) {
    try {
      const itemId = req.params.itemId as string;
      const redemption = await StoreEngine.requestRedemption(
        itemId,
        (req as any).user.id,
        (req as any).user.familyId,
      );
      res.status(201).json({ success: true, data: redemption });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async approveRedemption(req: Request, res: Response) {
    try {
      const redemptionId = req.params.redemptionId as string;
      const redemption = await StoreEngine.approveRedemption(
        redemptionId,
        (req as any).user.id,
        req.body.approved,
        req.body.reason,
      );
      res.json({ success: true, data: redemption });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async fulfillRedemption(req: Request, res: Response) {
    try {
      const redemptionId = req.params.redemptionId as string;
      const redemption = await StoreEngine.fulfillRedemption(redemptionId);
      res.json({ success: true, data: redemption });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelRedemption(req: Request, res: Response) {
    try {
      const redemptionId = req.params.redemptionId as string;
      const redemption = await StoreEngine.cancelRedemption(
        redemptionId,
        (req as any).user.id,
      );
      res.json({ success: true, data: redemption });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getChildRedemptions(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const redemptions = await StoreEngine.getChildRedemptions(
        childId,
        req.query.status as string,
      );
      res.json({ success: true, data: redemptions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFamilyRedemptions(req: Request, res: Response) {
    try {
      const redemptions = await StoreEngine.getFamilyRedemptions(
        (req as any).user.familyId,
        req.query.status as string,
      );
      res.json({ success: true, data: redemptions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await StoreEngine.getStoreStats((req as any).user.familyId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
