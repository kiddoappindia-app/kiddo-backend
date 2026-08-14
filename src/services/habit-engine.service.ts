import { HabitSnapshot } from '../models/habit-snapshot.model.js';
import { IntelligenceEvent } from '../models/intelligence-event.model.js';
import { Types } from 'mongoose';

const HABIT_EVENT_MAPPING: Record<string, string[]> = {
  task_completion: ['task_completed', 'task_approved'],
  homework_completion: ['homework_submitted', 'homework_graded'],
  reading: ['reading_session'],
  exercise: ['exercise_completed', 'fitness_session'],
  attendance: ['attendance_present', 'attendance_late', 'attendance_absent'],
  morning_routine: ['task_completed'],
  study_time: ['homework_submitted', 'reading_session'],
  kindness: ['reward_earned'],
  creativity: ['achievement_unlocked', 'challenge_completed'],
};

export class HabitEngineService {
  async analyzeHabit(userId: string, habitType: string, period: 'daily' | 'weekly' | 'monthly') {
    const { startDate, endDate } = this.getPeriodRange(period);
    const eventTypes = HABIT_EVENT_MAPPING[habitType] || [];

    const [events, totalPossible] = await Promise.all([
      IntelligenceEvent.find({
        userId: new Types.ObjectId(userId),
        type: { $in: eventTypes },
        timestamp: { $gte: startDate, $lte: endDate },
      }),
      this.getTotalPossible(userId, habitType, startDate, endDate),
    ]);

    const completed = events.length;
    const missed = Math.max(0, totalPossible - completed);
    const completionRate = totalPossible > 0 ? (completed / totalPossible) * 100 : 0;
    const averageDuration = events.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0) / (events.length || 1);

    // Calculate previous period for comparison
    const prevRange = this.getPreviousPeriodRange(period);
    const prevEvents = await IntelligenceEvent.countDocuments({
      userId: new Types.ObjectId(userId),
      type: { $in: eventTypes },
      timestamp: { $gte: prevRange.startDate, $lte: prevRange.endDate },
    });

    const prevRate = totalPossible > 0 ? (prevEvents / totalPossible) * 100 : 0;
    const changePercent = prevRate > 0 ? ((completionRate - prevRate) / prevRate) * 100 : 0;

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' | 'new' = 'new';
    if (prevEvents > 0) {
      if (changePercent > 10) trend = 'improving';
      else if (changePercent < -10) trend = 'declining';
      else trend = 'stable';
    }

    // Calculate consistency (how evenly distributed events are across the period)
    const consistency = this.calculateConsistency(events, startDate, endDate, period);

    // Streak calculation
    const streaks = await this.calculateStreaks(userId, eventTypes);

    const snapshot = await HabitSnapshot.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), habitType, period, periodStart: startDate },
      {
        completionRate: Math.round(completionRate * 10) / 10,
        totalEvents: totalPossible,
        completedEvents: completed,
        missedEvents: missed,
        averageDuration: Math.round(averageDuration),
        consistency,
        trend,
        previousPeriodRate: Math.round(prevRate * 10) / 10,
        changePercent: Math.round(changePercent * 10) / 10,
        bestStreak: streaks.best,
        currentStreak: streaks.current,
        periodEnd: endDate,
      },
      { upsert: true, new: true },
    );

    return snapshot;
  }

  async analyzeAllHabits(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    const habitTypes = Object.keys(HABIT_EVENT_MAPPING);
    const results = await Promise.all(
      habitTypes.map((type) => this.analyzeHabit(userId, type, period)),
    );
    return results;
  }

  async getHabitTrends(userId: string, habitType: string, periods: number = 12) {
    return HabitSnapshot.find({
      userId: new Types.ObjectId(userId),
      habitType,
    })
      .sort({ periodStart: -1 })
      .limit(periods);
  }

  async detectEmergingHabits(userId: string) {
    const recentHabits = await HabitSnapshot.find({
      userId: new Types.ObjectId(userId),
      period: 'weekly',
      trend: 'improving',
    }).sort({ periodStart: -1 }).limit(5);

    return recentHabits.filter((h) => h.changePercent > 20);
  }

  async detectDecliningHabits(userId: string) {
    const recentHabits = await HabitSnapshot.find({
      userId: new Types.ObjectId(userId),
      period: 'weekly',
      trend: 'declining',
    }).sort({ periodStart: -1 }).limit(5);

    return recentHabits.filter((h) => h.changePercent < -20);
  }

  private getPeriodRange(period: string) {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now);
    }

    return { startDate, endDate };
  }

  private getPreviousPeriodRange(period: string) {
    const { startDate, endDate } = this.getPeriodRange(period);
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime() - 1),
    };
  }

  private async getTotalPossible(userId: string, habitType: string, startDate: Date, endDate: Date): Promise<number> {
    // Estimate based on days in period
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    switch (habitType) {
      case 'task_completion': return days * 3; // Assume 3 tasks per day
      case 'homework_completion': return days * 2;
      case 'reading': return days;
      case 'exercise': return days;
      case 'attendance': return days;
      default: return days;
    }
  }

  private calculateConsistency(events: any[], startDate: Date, endDate: Date, period: string): number {
    if (events.length === 0) return 0;

    const dayMap = new Map<string, number>();
    events.forEach((e) => {
      const day = e.timestamp.toISOString().split('T')[0];
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const activeDays = dayMap.size;
    return Math.round((activeDays / totalDays) * 100);
  }

  private async calculateStreaks(userId: string, eventTypes: string[]) {
    const events = await IntelligenceEvent.find({
      userId: new Types.ObjectId(userId),
      type: { $in: eventTypes },
    }).sort({ timestamp: -1 }).limit(365);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    for (const event of events) {
      const eventDate = event.timestamp.toISOString().split('T')[0];
      if (lastDate === null) {
        tempStreak = 1;
        lastDate = eventDate;
      } else {
        const last = new Date(lastDate);
        const curr = new Date(eventDate);
        const diffDays = Math.round((last.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          tempStreak++;
          lastDate = eventDate;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
          lastDate = eventDate;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);
    currentStreak = tempStreak;

    return { current: currentStreak, best: bestStreak };
  }
}
