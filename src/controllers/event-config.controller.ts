import { Request, Response } from 'express';
import { EventConfigService } from '../services/event-config.service.js';

const service = new EventConfigService();

export class EventConfigController {
  async getEvents(req: Request, res: Response) {
    const { status, category } = req.query;
    const events = await service.getEvents(status as string, category as string);
    res.json({ success: true, data: events });
  }

  async getEventById(req: Request, res: Response) {
    const event = await service.getEventById(req.params.id as string);
    res.json({ success: true, data: event });
  }

  async getActiveEvents(_req: Request, res: Response) {
    const events = await service.getActiveEvents();
    res.json({ success: true, data: events });
  }

  async createEvent(req: Request, res: Response) {
    const userId = (req as any).userId;
    const event = await service.createEvent(req.body, userId);
    res.json({ success: true, data: event });
  }

  async updateEvent(req: Request, res: Response) {
    const event = await service.updateEvent(req.params.id as string, req.body);
    res.json({ success: true, data: event });
  }

  async activateEvent(req: Request, res: Response) {
    const event = await service.activateEvent(req.params.id as string);
    res.json({ success: true, data: event });
  }

  async endEvent(req: Request, res: Response) {
    const event = await service.endEvent(req.params.id as string);
    res.json({ success: true, data: event });
  }

  async deleteEvent(req: Request, res: Response) {
    await service.deleteEvent(req.params.id as string);
    res.json({ success: true });
  }

  async getUpcoming(_req: Request, res: Response) {
    const events = await service.getUpcomingEvents();
    res.json({ success: true, data: events });
  }

  async archiveEvent(req: Request, res: Response) {
    const event = await service.archiveEvent(req.params.id as string);
    res.json({ success: true, data: event });
  }
}
