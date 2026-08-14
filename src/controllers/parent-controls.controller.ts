import { Request, Response } from 'express';
import { ParentControlsService } from '../services/parent-controls.service.js';

export class ParentControlsController {
  static async getControls(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const controls = await ParentControlsService.getControls(childId);
      res.json(controls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateControls(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const updates = req.body;
      const controls = await ParentControlsService.updateControls(childId, updates);
      res.json(controls);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateAccessibility(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const accessibility = req.body;
      const controls = await ParentControlsService.updateAccessibility(childId, accessibility);
      res.json(controls);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateFeatureToggles(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const toggles = req.body;
      const controls = await ParentControlsService.updateFeatureToggles(childId, toggles);
      res.json(controls);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateStoreVisibility(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const visibility = req.body;
      const controls = await ParentControlsService.updateStoreVisibility(childId, visibility);
      res.json(controls);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateRewardMultipliers(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const multipliers = req.body;
      const controls = await ParentControlsService.updateRewardMultipliers(childId, multipliers);
      res.json(controls);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateSchedule(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const schedule = req.body;
      const controls = await ParentControlsService.updateSchedule(childId, schedule);
      res.json(controls);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async checkPlayTime(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const result = await ParentControlsService.checkPlayTime(userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
