import { Request, Response } from 'express';
import { ModerationService } from '../services/moderation.service.js';

const service = new ModerationService();

export class ModerationController {
  async getReports(req: Request, res: Response) {
    const { status, type, severity } = req.query;
    const reports = await service.getReports(status as string, type as string, severity as string);
    res.json({ success: true, data: reports });
  }

  async getReportById(req: Request, res: Response) {
    const report = await service.getReportById(req.params.id as string);
    res.json({ success: true, data: report });
  }

  async createReport(req: Request, res: Response) {
    const reporterId = (req as any).userId;
    const report = await service.createReport(req.body, reporterId);
    res.json({ success: true, data: report });
  }

  async reviewReport(req: Request, res: Response) {
    const reviewerId = (req as any).userId;
    const { action, resolution } = req.body;
    const report = await service.reviewReport(req.params.id as string, reviewerId, action, resolution);
    res.json({ success: true, data: report });
  }

  async resolveReport(req: Request, res: Response) {
    const reviewerId = (req as any).userId;
    const { resolution } = req.body;
    const report = await service.resolveReport(req.params.id as string, resolution, reviewerId);
    res.json({ success: true, data: report });
  }

  async escalateReport(req: Request, res: Response) {
    const { escalatedTo, reason, level } = req.body;
    const report = await service.escalateReport(req.params.id as string, escalatedTo, reason, level);
    res.json({ success: true, data: report });
  }

  async dismissReport(req: Request, res: Response) {
    const reviewerId = (req as any).userId;
    const { reason } = req.body;
    const report = await service.dismissReport(req.params.id as string, reviewerId, reason);
    res.json({ success: true, data: report });
  }

  async getReportsByTarget(req: Request, res: Response) {
    const targetType = req.params.targetType as string;
    const targetId = req.params.targetId as string;
    const reports = await service.getReportsByTarget(targetType, targetId);
    res.json({ success: true, data: reports });
  }

  async getStats(_req: Request, res: Response) {
    const stats = await service.getStats();
    res.json({ success: true, data: stats });
  }

  async getAuditTrail(req: Request, res: Response) {
    const audit = await service.getAuditTrail(req.params.id as string);
    res.json({ success: true, data: audit });
  }

  async getFlaggedContent(_req: Request, res: Response) {
    const flagged = await service.getFlaggedContent();
    res.json({ success: true, data: flagged });
  }
}
