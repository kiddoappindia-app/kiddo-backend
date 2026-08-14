import { Request, Response } from 'express';
import { ExperimentService } from '../services/experiment.service.js';

const service = new ExperimentService();

export class ExperimentController {
  async getExperiments(req: Request, res: Response) {
    const { status, category } = req.query;
    const experiments = await service.getExperiments(status as string, category as string);
    res.json({ success: true, data: experiments });
  }

  async getExperimentById(req: Request, res: Response) {
    const experiment = await service.getExperimentById(req.params.id as string);
    res.json({ success: true, data: experiment });
  }

  async createExperiment(req: Request, res: Response) {
    const userId = (req as any).userId;
    const experiment = await service.createExperiment(req.body, userId);
    res.json({ success: true, data: experiment });
  }

  async updateExperiment(req: Request, res: Response) {
    const experiment = await service.updateExperiment(req.params.id as string, req.body);
    res.json({ success: true, data: experiment });
  }

  async startExperiment(req: Request, res: Response) {
    const experiment = await service.startExperiment(req.params.id as string);
    res.json({ success: true, data: experiment });
  }

  async pauseExperiment(req: Request, res: Response) {
    const experiment = await service.pauseExperiment(req.params.id as string);
    res.json({ success: true, data: experiment });
  }

  async completeExperiment(req: Request, res: Response) {
    const experiment = await service.completeExperiment(req.params.id as string);
    res.json({ success: true, data: experiment });
  }

  async deleteExperiment(req: Request, res: Response) {
    await service.deleteExperiment(req.params.id as string);
    res.json({ success: true });
  }

  async getResults(req: Request, res: Response) {
    const results = await service.getResults(req.params.id as string);
    res.json({ success: true, data: results });
  }

  async assignVariant(req: Request, res: Response) {
    const userId = (req as any).userId;
    const variant = await service.assignVariant(req.params.id as string, userId);
    res.json({ success: true, data: { variant } });
  }
}
