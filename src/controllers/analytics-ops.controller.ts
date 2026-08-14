import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

const service = new AnalyticsService();

export class AnalyticsOpsController {
  async trackDaily(req: Request, res: Response) {
    const summary = await service.trackDaily(req.body);
    res.json({ success: true, data: summary });
  }

  async getDailySummary(req: Request, res: Response) {
    const { date } = req.query;
    const summary = await service.getDailySummary(date ? new Date(date as string) : undefined);
    res.json({ success: true, data: summary });
  }

  async getWeeklySummary(req: Request, res: Response) {
    const { weekStart } = req.query;
    const summary = await service.getWeeklySummary(weekStart ? new Date(weekStart as string) : undefined);
    res.json({ success: true, data: summary });
  }

  async getMonthlySummary(req: Request, res: Response) {
    const { year, month } = req.query;
    const summary = await service.getMonthlySummary(Number(year), Number(month));
    res.json({ success: true, data: summary });
  }

  async getTrend(req: Request, res: Response) {
    const { metric, days } = req.query;
    const trend = await service.getTrend(metric as string, Number(days) || 30);
    res.json({ success: true, data: trend });
  }

  async getDAUTrend(req: Request, res: Response) {
    const { days } = req.query;
    const trend = await service.getDAUTrend(Number(days) || 30);
    res.json({ success: true, data: trend });
  }

  async getRetentionTrend(req: Request, res: Response) {
    const { weeks } = req.query;
    const trend = await service.getRetentionTrend(Number(weeks) || 12);
    res.json({ success: true, data: trend });
  }

  async aggregateWeek(_req: Request, res: Response) {
    const summary = await service.aggregateWeek();
    res.json({ success: true, data: summary });
  }

  async aggregateMonth(req: Request, res: Response) {
    const { year, month } = req.query;
    const summary = await service.aggregateMonth(Number(year), Number(month));
    res.json({ success: true, data: summary });
  }
}
