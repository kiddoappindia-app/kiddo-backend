import { EventConfig } from '../models/event-config.model.js';

export class EventConfigService {
  async getEvents(status?: string, category?: string): Promise<any[]> {
    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = category;
    return EventConfig.find(query).sort({ startDate: -1 }).lean();
  }

  async getEventById(id: string): Promise<any> {
    return EventConfig.findById(id).lean();
  }

  async getActiveEvents(): Promise<any[]> {
    const now = new Date();
    return EventConfig.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();
  }

  async createEvent(data: any, userId: string): Promise<any> {
    return EventConfig.create({ ...data, createdBy: userId });
  }

  async updateEvent(id: string, data: any): Promise<any> {
    return EventConfig.findByIdAndUpdate(id, data, { new: true });
  }

  async activateEvent(id: string): Promise<any> {
    return EventConfig.findByIdAndUpdate(id, { status: 'active' }, { new: true });
  }

  async endEvent(id: string): Promise<any> {
    return EventConfig.findByIdAndUpdate(id, { status: 'ended' }, { new: true });
  }

  async deleteEvent(id: string): Promise<void> {
    await EventConfig.findByIdAndDelete(id);
  }

  async getUpcomingEvents(): Promise<any[]> {
    const now = new Date();
    return EventConfig.find({
      status: 'scheduled',
      startDate: { $gt: now },
    }).sort({ startDate: 1 }).lean();
  }

  async archiveEvent(id: string): Promise<any> {
    return EventConfig.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
  }
}
