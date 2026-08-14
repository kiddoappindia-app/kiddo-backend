import { Request, Response } from 'express';
import { AnnouncementService } from '../services/announcement-cms.service.js';

const service = new AnnouncementService();

export class AnnouncementCmsController {
  async getAnnouncements(req: Request, res: Response) {
    const { target, status } = req.query;
    const announcements = await service.getAnnouncements(target as string, status as string);
    res.json({ success: true, data: announcements });
  }

  async getAnnouncementById(req: Request, res: Response) {
    const announcement = await service.getAnnouncementById(req.params.id as string);
    res.json({ success: true, data: announcement });
  }

  async createAnnouncement(req: Request, res: Response) {
    const userId = (req as any).userId;
    const announcement = await service.createAnnouncement(req.body, userId);
    res.json({ success: true, data: announcement });
  }

  async updateAnnouncement(req: Request, res: Response) {
    const announcement = await service.updateAnnouncement(req.params.id as string, req.body);
    res.json({ success: true, data: announcement });
  }

  async publishAnnouncement(req: Request, res: Response) {
    const announcement = await service.publishAnnouncement(req.params.id as string);
    res.json({ success: true, data: announcement });
  }

  async scheduleAnnouncement(req: Request, res: Response) {
    const { scheduledAt } = req.body;
    const announcement = await service.scheduleAnnouncement(req.params.id as string, new Date(scheduledAt));
    res.json({ success: true, data: announcement });
  }

  async deleteAnnouncement(req: Request, res: Response) {
    await service.deleteAnnouncement(req.params.id as string);
    res.json({ success: true });
  }

  async getActive(req: Request, res: Response) {
    const { target, targetId } = req.query;
    const announcements = await service.getActiveAnnouncements(target as string, targetId as string);
    res.json({ success: true, data: announcements });
  }

  async acknowledge(req: Request, res: Response) {
    const userId = (req as any).userId;
    await service.acknowledgeAnnouncement(req.params.id as string, userId);
    res.json({ success: true });
  }

  async publishScheduled(_req: Request, res: Response) {
    const count = await service.publishScheduled();
    res.json({ success: true, data: { published: count } });
  }
}
