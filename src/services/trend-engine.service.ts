import { IntelligenceEvent } from '../models/intelligence-event.model.js';
import { Types } from 'mongoose';

export class TrendEngineService {
  async getTaskCompletionTrend(userId: string, weeks: number = 12) {
    const trends = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [completed, missed] = await Promise.all([
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: { $in: ['task_completed', 'task_approved'] },
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'task_missed',
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
      ]);

      const total = completed + missed;
      trends.push({
        weekStart,
        completed,
        missed,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }

    return trends;
  }

  async getHomeworkTrend(userId: string, weeks: number = 12) {
    const trends = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [submitted, late, missed] = await Promise.all([
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: { $in: ['homework_submitted', 'homework_graded'] },
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'homework_late',
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'homework_missed',
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
      ]);

      const total = submitted + late + missed;
      trends.push({
        weekStart,
        submitted,
        late,
        missed,
        rate: total > 0 ? Math.round((submitted / total) * 100) : 0,
      });
    }

    return trends;
  }

  async getAttendanceTrend(userId: string, weeks: number = 12) {
    const trends = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const [present, late, absent] = await Promise.all([
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'attendance_present',
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'attendance_late',
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
        IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'attendance_absent',
          timestamp: { $gte: weekStart, $lt: weekEnd },
        }),
      ]);

      const total = present + late + absent;
      trends.push({
        weekStart,
        present,
        late,
        absent,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    }

    return trends;
  }

  async getReadingTrend(userId: string, weeks: number = 12) {
    const trends = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const events = await IntelligenceEvent.find({
        userId: new Types.ObjectId(userId),
        type: 'reading_session',
        timestamp: { $gte: weekStart, $lt: weekEnd },
      });

      const totalMinutes = events.reduce((sum, e) => sum + (e.metadata?.duration || 15), 0);
      trends.push({
        weekStart,
        sessions: events.length,
        minutes: totalMinutes,
      });
    }

    return trends;
  }

  async getGrowthTrend(userId: string, weeks: number = 12) {
    const events = await IntelligenceEvent.find({
      userId: new Types.ObjectId(userId),
      type: { $in: ['task_completed', 'homework_submitted', 'reading_session', 'exercise_completed'] },
    }).sort({ timestamp: 1 });

    // Group by week and calculate rough growth
    const weeklyData: Record<string, number> = {};
    events.forEach((e) => {
      const weekKey = this.getWeekKey(e.timestamp);
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
    });

    return Object.entries(weeklyData).map(([week, count]) => ({
      week,
      events: count,
    }));
  }

  async getSourceDistribution(userId: string, startDate: Date, endDate: Date) {
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
          totalPoints: { $sum: '$metadata.points' },
        },
      },
    ]);
  }

  async getTopCategories(userId: string, startDate: Date, endDate: Date, limit: number = 5) {
    return IntelligenceEvent.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate, $lte: endDate },
          'metadata.category': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$metadata.category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }
}
