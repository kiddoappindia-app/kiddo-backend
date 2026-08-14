import { AnalyticsSnapshot, IAnalyticsSnapshot } from '../models/analytics.model.js';
import { Task } from '../models/task.model.js';
import { TaskCompletion } from '../models/task-completion.model.js';
import { Streak } from '../models/streak.model.js';

export class AnalyticsEngine {
  static async generateDailySnapshot(childId: string, familyId: string, date: Date): Promise<IAnalyticsSnapshot> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const tasksAssigned = await Task.countDocuments({
      assignedTo: childId,
      dueDate: { $gte: startOfDay, $lt: endOfDay },
    });

    const completions = await TaskCompletion.find({
      childId,
      completedAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const tasksCompleted = completions.length;
    const tasksMissed = Math.max(0, tasksAssigned - tasksCompleted);

    const tasksLate = completions.filter(c => {
      const task = Task.findById(c.taskId);
      return task && (task as any).dueDate && c.completedAt > (task as any).dueDate;
    }).length;

    const completionRate = tasksAssigned > 0 ? Math.round((tasksCompleted / tasksAssigned) * 100) : 0;
    const totalPointsEarned = completions.reduce((sum, c) => sum + c.totalPoints, 0);
    const totalCoinsEarned = completions.reduce((sum, c) => sum + Math.round(c.totalPoints * 0.5), 0);
    const totalXpEarned = completions.reduce((sum, c) => sum + c.totalPoints, 0);

    const avgCompletionMinutes = completions.length > 0
      ? Math.round(completions.reduce((sum, c) => sum + c.timeSpentMinutes, 0) / completions.length)
      : 0;

    const categoryCount: Record<string, number> = {};
    for (const c of completions) {
      const task = await Task.findById(c.taskId);
      if (task) {
        categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
      }
    }
    const favoriteCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const difficultyDist: Record<string, number> = {};
    for (const c of completions) {
      const task = await Task.findById(c.taskId);
      if (task) {
        difficultyDist[task.difficulty] = (difficultyDist[task.difficulty] || 0) + 1;
      }
    }

    const streak = await Streak.findOne({ childId, streakType: 'perfect_day' });

    const snapshot = await AnalyticsSnapshot.findOneAndUpdate(
      { childId, date: startOfDay },
      {
        familyId,
        childId,
        date: startOfDay,
        tasksCompleted,
        tasksAssigned,
        tasksMissed,
        tasksLate,
        completionRate,
        totalPointsEarned,
        totalCoinsEarned,
        totalXpEarned,
        streakDays: streak?.currentCount || 0,
        longestStreak: streak?.longestCount || 0,
        avgCompletionMinutes,
        favoriteCategory,
        difficultyDistribution: difficultyDist,
      },
      { upsert: true, new: true },
    );

    return snapshot;
  }

  static async getChildAnalytics(
    childId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    summary: {
      totalTasks: number;
      completedTasks: number;
      missedTasks: number;
      lateTasks: number;
      completionRate: number;
      totalPoints: number;
      totalCoins: number;
      totalXp: number;
      avgCompletionMinutes: number;
      currentStreak: number;
      longestStreak: number;
    };
    dailyData: IAnalyticsSnapshot[];
    categoryBreakdown: Record<string, { completed: number; total: number }>;
    difficultyBreakdown: Record<string, number>;
    weeklyTrend: { week: string; completionRate: number; points: number }[];
  }> {
    const snapshots = await AnalyticsSnapshot.find({
      childId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const summary = {
      totalTasks: snapshots.reduce((sum, s) => sum + s.tasksAssigned, 0),
      completedTasks: snapshots.reduce((sum, s) => sum + s.tasksCompleted, 0),
      missedTasks: snapshots.reduce((sum, s) => sum + s.tasksMissed, 0),
      lateTasks: snapshots.reduce((sum, s) => sum + s.tasksLate, 0),
      completionRate: 0,
      totalPoints: snapshots.reduce((sum, s) => sum + s.totalPointsEarned, 0),
      totalCoins: snapshots.reduce((sum, s) => sum + s.totalCoinsEarned, 0),
      totalXp: snapshots.reduce((sum, s) => sum + s.totalXpEarned, 0),
      avgCompletionMinutes: 0,
      currentStreak: snapshots[snapshots.length - 1]?.streakDays || 0,
      longestStreak: Math.max(...snapshots.map(s => s.longestStreak), 0),
    };

    summary.completionRate = summary.totalTasks > 0
      ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
      : 0;

    const totalMinutes = snapshots.reduce((sum, s) => sum + s.avgCompletionMinutes * s.tasksCompleted, 0);
    summary.avgCompletionMinutes = summary.completedTasks > 0
      ? Math.round(totalMinutes / summary.completedTasks)
      : 0;

    const categoryBreakdown: Record<string, { completed: number; total: number }> = {};
    const difficultyBreakdown: Record<string, number> = {};

    for (const snapshot of snapshots) {
      for (const [diff, count] of Object.entries(snapshot.difficultyDistribution)) {
        difficultyBreakdown[diff] = (difficultyBreakdown[diff] || 0) + count;
      }
    }

    const weeklyTrend: { week: string; completionRate: number; points: number }[] = [];
    const weekMap = new Map<string, { completed: number; assigned: number; points: number }>();

    for (const snapshot of snapshots) {
      const weekStart = this.getWeekStart(snapshot.date);
      const weekKey = weekStart.toISOString().split('T')[0];
      const existing = weekMap.get(weekKey) || { completed: 0, assigned: 0, points: 0 };
      existing.completed += snapshot.tasksCompleted;
      existing.assigned += snapshot.tasksAssigned;
      existing.points += snapshot.totalPointsEarned;
      weekMap.set(weekKey, existing);
    }

    for (const [week, data] of weekMap) {
      weeklyTrend.push({
        week,
        completionRate: data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0,
        points: data.points,
      });
    }

    return {
      summary,
      dailyData: snapshots,
      categoryBreakdown,
      difficultyBreakdown,
      weeklyTrend,
    };
  }

  static async getFamilyAnalytics(familyId: string, startDate: Date, endDate: Date): Promise<{
    children: {
      childId: string;
      name: string;
      completionRate: number;
      totalPoints: number;
      currentStreak: number;
    }[];
    overallCompletionRate: number;
    totalPointsEarned: number;
  }> {
    const snapshots = await AnalyticsSnapshot.find({
      familyId,
      date: { $gte: startDate, $lte: endDate },
    });

    const childMap = new Map<string, {
      completed: number;
      assigned: number;
      points: number;
      streak: number;
    }>();

    for (const snapshot of snapshots) {
      const existing = childMap.get(snapshot.childId.toString()) || {
        completed: 0,
        assigned: 0,
        points: 0,
        streak: 0,
      };
      existing.completed += snapshot.tasksCompleted;
      existing.assigned += snapshot.tasksAssigned;
      existing.points += snapshot.totalPointsEarned;
      existing.streak = snapshot.streakDays;
      childMap.set(snapshot.childId.toString(), existing);
    }

    const children = Array.from(childMap.entries()).map(([childId, data]) => ({
      childId,
      name: '',
      completionRate: data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0,
      totalPoints: data.points,
      currentStreak: data.streak,
    }));

    const totalCompleted = children.reduce((sum, c) => sum + (c.completionRate > 0 ? c.completionRate : 0), 0);
    const overallCompletionRate = children.length > 0 ? Math.round(totalCompleted / children.length) : 0;
    const totalPointsEarned = children.reduce((sum, c) => sum + c.totalPoints, 0);

    return {
      children,
      overallCompletionRate,
      totalPointsEarned,
    };
  }

  static async getHabitIntelligence(childId: string, days = 30): Promise<{
    skippedHabits: { category: string; skipCount: number }[];
    improvingHabits: { category: string; trend: number }[];
    weakHabits: { category: string; completionRate: number }[];
    strongHabits: { category: string; completionRate: number }[];
    trendSummary: string;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasks = await Task.find({
      assignedTo: childId,
      isRecurring: true,
      status: { $in: ['todo', 'in_progress', 'completed', 'approved'] },
    });

    const categoryStats: Record<string, { total: number; completed: number; history: number[] }> = {};

    for (const task of tasks) {
      const cat = task.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, completed: 0, history: [] };
      }
      categoryStats[cat].total += 1;
      if (['completed', 'approved'].includes(task.status)) {
        categoryStats[cat].completed += 1;
      }
    }

    const skippedHabits: { category: string; skipCount: number }[] = [];
    const improvingHabits: { category: string; trend: number }[] = [];
    const weakHabits: { category: string; completionRate: number }[] = [];
    const strongHabits: { category: string; completionRate: number }[] = [];

    for (const [category, stats] of Object.entries(categoryStats)) {
      const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

      if (rate < 30) {
        skippedHabits.push({ category, skipCount: stats.total - stats.completed });
      } else if (rate < 60) {
        weakHabits.push({ category, completionRate: Math.round(rate) });
      } else if (rate >= 80) {
        strongHabits.push({ category, completionRate: Math.round(rate) });
      }

      if (rate > 50) {
        improvingHabits.push({ category, trend: Math.round(rate) });
      }
    }

    const habitCount = Object.keys(categoryStats).length;
    const avgRate = habitCount > 0
      ? Object.values(categoryStats).reduce((sum, s) => sum + (s.total > 0 ? s.completed / s.total : 0), 0) / habitCount * 100
      : 0;

    const trendSummary = `Tracking ${habitCount} habits. Overall completion rate: ${Math.round(avgRate)}%. ${strongHabits.length} strong habits, ${weakHabits.length} need attention.`;

    return {
      skippedHabits,
      improvingHabits,
      weakHabits,
      strongHabits,
      trendSummary,
    };
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
