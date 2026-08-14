import { Request, Response } from 'express';
import { AccessibilityService } from '../services/accessibility.service.js';

const service = new AccessibilityService();

export class AccessibilityController {
  async getPreset(req: Request, res: Response) {
    const preset = await service.getPreset(req.params.preset as string);
    res.json({ success: true, data: preset });
  }

  async getUserSettings(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const { childId } = req.query;
    const settings = await service.getUserSettings(userId, childId as string);
    res.json({ success: true, data: settings });
  }

  async setUserSettings(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const { childId } = req.query;
    const settings = await service.setUserSettings(userId, req.body, childId as string);
    res.json({ success: true, data: settings });
  }

  async applyPreset(req: Request, res: Response) {
    const userId = req.params.userId as string;
    const { preset, childId } = req.body;
    const settings = await service.applyPreset(userId, preset, childId);
    res.json({ success: true, data: settings });
  }

  async getSchoolAccessibility(req: Request, res: Response) {
    const settings = await service.getSchoolAccessibility(req.params.schoolId as string);
    res.json({ success: true, data: settings });
  }

  async getFamilyAccessibility(req: Request, res: Response) {
    const settings = await service.getFamilyAccessibility(req.params.familyId as string);
    res.json({ success: true, data: settings });
  }

  async applyBulkPreset(req: Request, res: Response) {
    const { userIds, preset } = req.body;
    const count = await service.applyBulkPreset(userIds, preset);
    res.json({ success: true, data: { updated: count } });
  }
}
