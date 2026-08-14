import { AnnouncementCms } from '../models/announcement-cms.model.js';

export class AnnouncementService {
  async getAnnouncements(target?: string, status?: string): Promise<any[]> {
    const query: any = {};
    if (target) query.target = target;
    if (status) query.status = status;
    return AnnouncementCms.find(query).sort({ createdAt: -1 }).lean();
  }

  async getAnnouncementById(id: string): Promise<any> {
    return AnnouncementCms.findById(id).lean();
  }

  async createAnnouncement(data: any, userId: string): Promise<any> {
    return AnnouncementCms.create({ ...data, createdBy: userId });
  }

  async updateAnnouncement(id: string, data: any): Promise<any> {
    return AnnouncementCms.findByIdAndUpdate(id, data, { new: true });
  }

  async publishAnnouncement(id: string): Promise<any> {
    return AnnouncementCms.findByIdAndUpdate(id, {
      status: 'published',
      publishedAt: new Date(),
    }, { new: true });
  }

  async scheduleAnnouncement(id: string, scheduledAt: Date): Promise<any> {
    return AnnouncementCms.findByIdAndUpdate(id, {
      status: 'scheduled',
      scheduledAt,
    }, { new: true });
  }

  async expireAnnouncement(id: string): Promise<any> {
    return AnnouncementCms.findByIdAndUpdate(id, { status: 'expired' }, { new: true });
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await AnnouncementCms.findByIdAndDelete(id);
  }

  async getActiveAnnouncements(target: string, targetId?: string): Promise<any[]> {
    const now = new Date();
    const query: any = {
      status: 'published',
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    };
    if (target === 'global') {
      query.target = 'global';
    } else if (targetId) {
      query.$or = [
        { target: 'global' },
        { target, targetIds: targetId },
      ];
    }
    return AnnouncementCms.find(query).sort({ priority: -1, createdAt: -1 }).lean();
  }

  async acknowledgeAnnouncement(id: string, userId: string): Promise<any> {
    return AnnouncementCms.findByIdAndUpdate(id, {
      $push: { 'acknowledgement.responses': { userId, acknowledgedAt: new Date() } },
    }, { new: true });
  }

  async trackView(id: string): Promise<void> {
    await AnnouncementCms.findByIdAndUpdate(id, { $inc: { 'analytics.views': 1 } });
  }

  async trackClick(id: string): Promise<void> {
    await AnnouncementCms.findByIdAndUpdate(id, { $inc: { 'analytics.clicks': 1 } });
  }

  async getScheduledAnnouncements(): Promise<any[]> {
    const now = new Date();
    return AnnouncementCms.find({
      status: 'scheduled',
      scheduledAt: { $lte: now },
    }).lean();
  }

  async publishScheduled(): Promise<number> {
    const now = new Date();
    const result = await AnnouncementCms.updateMany(
      { status: 'scheduled', scheduledAt: { $lte: now } },
      { status: 'published', publishedAt: now },
    );
    return result.modifiedCount;
  }
}
