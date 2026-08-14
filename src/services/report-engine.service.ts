import { Report } from '../models/report.model.js';
import { DailySummary, WeeklySummary, MonthlySummary } from '../models/analytics-summary.model.js';
import { GrowthProfile } from '../models/growth-profile.model.js';
import { GeneratedInsight } from '../models/generated-insight.model.js';
import { IntelligenceEvent } from '../models/intelligence-event.model.js';
import { Types } from 'mongoose';

export class ReportEngineService {
  async generateParentWeeklyReport(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [events, growthProfile, insights] = await Promise.all([
      IntelligenceEvent.find({
        userId: new Types.ObjectId(userId),
        timestamp: { $gte: weekStart, $lt: weekEnd },
      }),
      GrowthProfile.findOne({ userId: new Types.ObjectId(userId) }),
      GeneratedInsight.find({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: weekStart, $lt: weekEnd },
      }),
    ]);

    const tasksCompleted = events.filter((e) => ['task_completed', 'task_approved'].includes(e.type)).length;
    const tasksMissed = events.filter((e) => e.type === 'task_missed').length;
    const homeworkSubmitted = events.filter((e) => ['homework_submitted', 'homework_graded'].includes(e.type)).length;
    const homeworkLate = events.filter((e) => e.type === 'homework_late').length;
    const readingEvents = events.filter((e) => e.type === 'reading_session');
    const readingMinutes = readingEvents.reduce((sum, e) => sum + (e.metadata?.duration || 15), 0);
    const coinsEarned = events.reduce((sum, e) => sum + (e.metadata?.coins || 0), 0);
    const xpEarned = events.reduce((sum, e) => sum + (e.metadata?.xp || 0), 0);
    const achievements = events.filter((e) => e.type === 'achievement_unlocked').length;

    // Determine highlights
    const highlights = [];
    if (tasksCompleted > 0 && tasksMissed === 0) {
      highlights.push({ type: 'perfect_tasks', title: 'All Tasks Completed', description: 'No tasks were missed this week!', icon: '⭐' });
    }
    if (readingMinutes >= 60) {
      highlights.push({ type: 'reading_goal', title: 'Reading Goal Met', description: `${readingMinutes} minutes of reading this week`, icon: '📚' });
    }
    if (achievements > 0) {
      highlights.push({ type: 'achievements', title: 'New Achievements', description: `${achievements} new achievements unlocked`, icon: '🏆' });
    }

    // Missed opportunities
    const missedOpportunities = [];
    if (tasksMissed > 0) {
      missedOpportunities.push({ type: 'missed_tasks', description: `${tasksMissed} tasks were missed`, impact: 'Consistency affected' });
    }
    if (homeworkLate > 0) {
      missedOpportunities.push({ type: 'late_homework', description: `${homeworkLate} homework submissions were late`, impact: 'Responsibility score affected' });
    }

    const report = await Report.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), type: 'parent_weekly', periodStart: weekStart },
      {
        summary: {
          tasksCompleted,
          tasksTotal: tasksCompleted + tasksMissed,
          homeworkCompleted: homeworkSubmitted,
          homeworkTotal: homeworkSubmitted + homeworkLate,
          attendanceRate: this.calculateAttendanceRate(events),
          readingMinutes,
          coinsEarned,
          xpEarned,
          achievementsUnlocked: achievements,
          streakDays: this.calculateStreakDays(events),
          growthScore: growthProfile?.overallScore || 0,
          growthChange: 0,
        },
        growthDimensions: growthProfile?.dimensions || {},
        highlights,
        missedOpportunities,
        insights: insights.map((i) => i._id),
        status: 'generated',
      },
      { upsert: true, new: true },
    );

    return report;
  }

  async generateTeacherWeeklyReport(teacherId: string, classId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const events = await IntelligenceEvent.find({
      classId: new Types.ObjectId(classId),
      source: 'school',
      timestamp: { $gte: weekStart, $lt: weekEnd },
    });

    const homeworkSubmitted = events.filter((e) => ['homework_submitted', 'homework_graded'].includes(e.type)).length;
    const homeworkMissed = events.filter((e) => e.type === 'homework_missed').length;
    const attendancePresent = events.filter((e) => e.type === 'attendance_present').length;
    const attendanceLate = events.filter((e) => e.type === 'attendance_late').length;
    const attendanceAbsent = events.filter((e) => e.type === 'attendance_absent').length;

    const highlights = [];
    if (homeworkMissed === 0 && homeworkSubmitted > 0) {
      highlights.push({ type: 'perfect_homework', title: '100% Homework Submission', description: 'All students submitted homework on time', icon: '📝' });
    }

    return {
      classId,
      period: { weekStart, weekEnd },
      homework: { submitted: homeworkSubmitted, missed: homeworkMissed },
      attendance: { present: attendancePresent, late: attendanceLate, absent: attendanceAbsent },
      highlights,
    };
  }

  async generateChildCelebrationReport(userId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const events = await IntelligenceEvent.find({
      userId: new Types.ObjectId(userId),
      timestamp: { $gte: weekStart, $lt: weekEnd },
    });

    const tasksCompleted = events.filter((e) => ['task_completed', 'task_approved'].includes(e.type)).length;
    const achievements = events.filter((e) => e.type === 'achievement_unlocked').length;
    const readingSessions = events.filter((e) => e.type === 'reading_session').length;

    const celebrations = [];
    if (tasksCompleted >= 10) celebrations.push('Task Master: 10+ tasks completed!');
    if (readingSessions >= 5) celebrations.push('Bookworm: 5+ reading sessions!');
    if (achievements > 0) celebrations.push(`Achievement Hunter: ${achievements} new achievements!`);

    return {
      userId,
      period: { weekStart, weekEnd },
      tasksCompleted,
      achievements,
      readingSessions,
      celebrations,
      message: celebrations.length > 0
        ? `Amazing week! You earned ${celebrations.length} celebrations!`
        : 'Keep going! Every day is a chance to grow!',
    };
  }

  async getReports(userId: string, type?: string, limit: number = 10) {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (type) query.type = type;
    return Report.find(query).sort({ periodStart: -1 }).limit(limit);
  }

  async getReport(reportId: string) {
    return Report.findById(reportId).populate('insights');
  }

  private calculateAttendanceRate(events: any[]): number {
    const attendanceEvents = events.filter((e) => e.type.startsWith('attendance_'));
    if (attendanceEvents.length === 0) return 0;
    const present = attendanceEvents.filter((e) => e.type === 'attendance_present').length;
    return Math.round((present / attendanceEvents.length) * 100);
  }

  private calculateStreakDays(events: any[]): number {
    const days = new Set(events.map((e) => e.timestamp.toISOString().split('T')[0]));
    return days.size;
  }
}
