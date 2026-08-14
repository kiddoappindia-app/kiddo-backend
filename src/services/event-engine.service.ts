import { IntelligenceEvent, EventType, EventSource } from '../models/intelligence-event.model.js';
import { Types } from 'mongoose';

export class EventEngineService {
  async trackEvent(data: {
    userId: string;
    familyId?: string;
    schoolId?: string;
    classId?: string;
    type: EventType;
    source: EventSource;
    metadata?: Record<string, any>;
  }) {
    return IntelligenceEvent.create({
      userId: new Types.ObjectId(data.userId),
      familyId: data.familyId ? new Types.ObjectId(data.familyId) : undefined,
      schoolId: data.schoolId ? new Types.ObjectId(data.schoolId) : undefined,
      classId: data.classId ? new Types.ObjectId(data.classId) : undefined,
      type: data.type,
      source: data.source,
      metadata: data.metadata || {},
    });
  }

  async getEvents(userId: string, options?: { type?: string; source?: string; startDate?: Date; endDate?: Date; limit?: number; skip?: number }) {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (options?.type) query.type = options.type;
    if (options?.source) query.source = options.source;
    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options.startDate) query.timestamp.$gte = options.startDate;
      if (options.endDate) query.timestamp.$lte = options.endDate;
    }
    return IntelligenceEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50);
  }

  async getEventCounts(userId: string, startDate: Date, endDate: Date) {
    return IntelligenceEvent.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalPoints: { $sum: '$metadata.points' },
          totalXp: { $sum: '$metadata.xp' },
          totalCoins: { $sum: '$metadata.coins' },
        },
      },
    ]);
  }

  async getSourceBreakdown(userId: string, startDate: Date, endDate: Date) {
    return IntelligenceEvent.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getTimeline(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return IntelligenceEvent.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$type',
          },
          count: { $sum: 1 },
          totalPoints: { $sum: '$metadata.points' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);
  }

  async processUnprocessedEvents(batchSize: number = 100) {
    const events = await IntelligenceEvent.find({ processed: false })
      .sort({ timestamp: 1 })
      .limit(batchSize);

    for (const event of events) {
      // Mark as processed - actual processing done by GrowthEngine, HabitEngine, etc.
      event.processed = true;
      event.processedAt = new Date();
      await event.save();
    }

    return events.length;
  }
}
