import { DailySummary, WeeklySummary, MonthlySummary } from '../models/analytics-summary.model.js';
import { IntelligenceEvent } from '../models/intelligence-event.model.js';
import { GrowthProfile } from '../models/growth-profile.model.js';
import { Types } from 'mongoose';

export class AnalyticsAggregatorService {
  async generateDailySummary(userId: string, date: Date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const events = await IntelligenceEvent.find({
      userId: new Types.ObjectId(userId),
      timestamp: { $gte: dayStart, $lt: dayEnd },
    });

    const tasksCompleted = events.filter((e) => ['task_completed', 'task_approved'].includes(e.type)).length;
    const tasksMissed = events.filter((e) => e.type === 'task_missed').length;
    const homeworkSubmitted = events.filter((e) => ['homework_submitted', 'homework_graded'].includes(e.type)).length;
    const homeworkGraded = events.filter((e) => e.type === 'homework_graded').length;
    const readingEvents = events.filter((e) => e.type === 'reading_session');
    const readingMinutes = readingEvents.reduce((sum, e) => sum + (e.metadata?.duration || 15), 0);
    const exerciseEvents = events.filter((e) => ['exercise_completed', 'fitness_session'].includes(e.type));
    const exerciseMinutes = exerciseEvents.reduce((sum, e) => sum + (e.metadata?.duration || 30), 0);
    const coinsEarned = events.reduce((sum, e) => sum + (e.metadata?.coins || 0), 0);
    const xpEarned = events.reduce((sum, e) => sum + (e.metadata?.xp || 0), 0);
    const achievements = events.filter((e) => e.type === 'achievement_unlocked').length;

    const attendanceEvent = events.find((e) => e.type.startsWith('attendance_'));
    const attendanceStatus = attendanceEvent?.type.replace('attendance_', '') || undefined;

    // Category counts
    const categoryMap: Record<string, number> = {};
    events.forEach((e) => {
      const cat = e.metadata?.category || 'general';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return DailySummary.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: dayStart },
      {
        eventsCount: events.length,
        tasksCompleted,
        tasksMissed,
        homeworkSubmitted,
        homeworkGraded,
        attendanceStatus,
        readingMinutes,
        exerciseMinutes,
        coinsEarned,
        xpEarned,
        achievementsUnlocked: achievements,
        topCategories,
      },
      { upsert: true, new: true },
    );
  }

  async generateWeeklySummary(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [events, growthProfile] = await Promise.all([
      IntelligenceEvent.find({
        userId: new Types.ObjectId(userId),
        timestamp: { $gte: weekStart, $lt: weekEnd },
      }),
      GrowthProfile.findOne({ userId: new Types.ObjectId(userId) }),
    ]);

    const tasksCompleted = events.filter((e) => ['task_completed', 'task_approved'].includes(e.type)).length;
    const tasksMissed = events.filter((e) => e.type === 'task_missed').length;
    const homeworkSubmitted = events.filter((e) => ['homework_submitted', 'homework_graded'].includes(e.type)).length;
    const homeworkLate = events.filter((e) => e.type === 'homework_late').length;
    const readingEvents = events.filter((e) => e.type === 'reading_session');
    const readingMinutes = readingEvents.reduce((sum, e) => sum + (e.metadata?.duration || 15), 0);
    const exerciseEvents = events.filter((e) => ['exercise_completed', 'fitness_session'].includes(e.type));
    const exerciseMinutes = exerciseEvents.reduce((sum, e) => sum + (e.metadata?.duration || 30), 0);
    const coinsEarned = events.reduce((sum, e) => sum + (e.metadata?.coins || 0), 0);
    const xpEarned = events.reduce((sum, e) => sum + (e.metadata?.xp || 0), 0);
    const achievements = events.filter((e) => e.type === 'achievement_unlocked').length;

    const daysActive = new Set(events.map((e) => e.timestamp.toISOString().split('T')[0])).size;

    // Attendance
    const attendanceEvents = events.filter((e) => e.type.startsWith('attendance_'));
    const attendancePresent = attendanceEvents.filter((e) => e.type === 'attendance_present').length;
    const attendanceRate = attendanceEvents.length > 0 ? Math.round((attendancePresent / attendanceEvents.length) * 100) : 0;

    // Growth
    const dimensionScores: Record<string, number> = {};
    const dimensionChanges: Record<string, number> = {};
    if (growthProfile && growthProfile.dimensions) {
      for (const [key, dim] of Object.entries(growthProfile.dimensions as any)) {
        dimensionScores[key] = (dim as any).score;
        dimensionChanges[key] = (dim as any).score - (dim as any).previousScore;
      }
    }

    // Highlights
    const highlights: string[] = [];
    if (tasksCompleted > 0 && tasksMissed === 0) highlights.push('Perfect task completion');
    if (readingMinutes >= 60) highlights.push(`Read for ${readingMinutes} minutes`);
    if (attendanceRate === 100) highlights.push('Perfect attendance');
    if (achievements > 0) highlights.push(`${achievements} new achievements`);

    // Lowlights
    const lowlights: string[] = [];
    if (tasksMissed > 0) lowlights.push(`${tasksMissed} tasks missed`);
    if (homeworkLate > 0) lowlights.push(`${homeworkLate} late submissions`);

    // Best/worst dimensions
    let topDim = 'responsibility';
    let worstDim = 'responsibility';
    let topScore = 0;
    let worstScore = 100;
    for (const [key, score] of Object.entries(dimensionScores)) {
      if (score > topScore) { topScore = score; topDim = key; }
      if (score < worstScore) { worstScore = score; worstDim = key; }
    }

    return WeeklySummary.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), weekStart },
      {
        weekEnd,
        daysActive,
        totalEvents: events.length,
        tasksCompleted,
        tasksMissed,
        homeworkCompleted: homeworkSubmitted,
        homeworkTotal: homeworkSubmitted + homeworkLate,
        attendanceRate,
        readingMinutes,
        exerciseMinutes,
        coinsEarned,
        xpEarned,
        achievementsUnlocked: achievements,
        streakDays: daysActive,
        overallGrowthScore: growthProfile?.overallScore || 0,
        dimensionScores,
        dimensionChanges,
        highlights,
        lowlights,
        topPerformingDimension: topDim,
        needsAttentionDimension: worstDim,
      },
      { upsert: true, new: true },
    );
  }

  async generateMonthlySummary(userId: string, year: number, month: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const events = await IntelligenceEvent.find({
      userId: new Types.ObjectId(userId),
      timestamp: { $gte: monthStart, $lt: monthEnd },
    });

    const tasksCompleted = events.filter((e) => ['task_completed', 'task_approved'].includes(e.type)).length;
    const tasksMissed = events.filter((e) => e.type === 'task_missed').length;
    const homeworkSubmitted = events.filter((e) => ['homework_submitted', 'homework_graded'].includes(e.type)).length;
    const homeworkLate = events.filter((e) => e.type === 'homework_late').length;
    const readingMinutes = events.filter((e) => e.type === 'reading_session').reduce((sum, e) => sum + (e.metadata?.duration || 15), 0);
    const exerciseMinutes = events.filter((e) => ['exercise_completed', 'fitness_session'].includes(e.type)).reduce((sum, e) => sum + (e.metadata?.duration || 30), 0);
    const coinsEarned = events.reduce((sum, e) => sum + (e.metadata?.coins || 0), 0);
    const xpEarned = events.reduce((sum, e) => sum + (e.metadata?.xp || 0), 0);
    const achievements = events.filter((e) => e.type === 'achievement_unlocked').length;

    const daysActive = new Set(events.map((e) => e.timestamp.toISOString().split('T')[0])).size;

    const highlights: string[] = [];
    if (tasksCompleted > 50) highlights.push('Task Master: 50+ tasks completed');
    if (readingMinutes >= 300) highlights.push('Reading Champion: 5+ hours of reading');
    if (achievements >= 5) highlights.push('Achievement Collector: 5+ achievements');

    return MonthlySummary.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), year, month },
      {
        daysActive,
        totalEvents: events.length,
        tasksCompleted,
        tasksMissed,
        homeworkCompleted: homeworkSubmitted,
        homeworkTotal: homeworkSubmitted + homeworkLate,
        readingMinutes,
        exerciseMinutes,
        coinsEarned,
        xpEarned,
        achievementsUnlocked: achievements,
        highlights,
      },
      { upsert: true, new: true },
    );
  }

  async getDailySummaries(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return DailySummary.find({ userId: new Types.ObjectId(userId), date: { $gte: startDate } }).sort({ date: -1 });
  }

  async getWeeklySummaries(userId: string, weeks: number = 12) {
    return WeeklySummary.find({ userId: new Types.ObjectId(userId) }).sort({ weekStart: -1 }).limit(weeks);
  }

  async getMonthlySummaries(userId: string, months: number = 12) {
    return MonthlySummary.find({ userId: new Types.ObjectId(userId) }).sort({ year: -1, month: -1 }).limit(months);
  }
}
