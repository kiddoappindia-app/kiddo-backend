import { OperationalAnalytics } from '../models/operational-analytics.model.js';
import { AnalyticsEngine } from './analytics-engine.service.js';
import { User } from '../models/user.model.js';
import { Task } from '../models/task.model.js';
import { Reward } from '../models/reward.model.js';

export class AnalyticsService {
  async trackDaily(data: any): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return OperationalAnalytics.findOneAndUpdate(
      { date: today, period: 'daily' },
      { $set: data },
      { upsert: true, new: true },
    );
  }

  async getDailySummary(date?: Date): Promise<any> {
    const target = date || new Date();
    target.setHours(0, 0, 0, 0);
    return OperationalAnalytics.findOne({ date: target, period: 'daily' }).lean();
  }

  async getWeeklySummary(weekStart?: Date): Promise<any> {
    const start = weekStart || this.getWeekStart();
    return OperationalAnalytics.findOne({ date: start, period: 'weekly' }).lean();
  }

  async getMonthlySummary(year: number, month: number): Promise<any> {
    const date = new Date(year, month, 1);
    return OperationalAnalytics.findOne({ date, period: 'monthly' }).lean();
  }

  async getTrend(metric: string, days = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return OperationalAnalytics.find({
      period: 'daily',
      date: { $gte: startDate },
    }).sort({ date: 1 }).select(`date ${metric}`).lean();
  }

  async getDAUTrend(days = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return OperationalAnalytics.find({
      period: 'daily',
      date: { $gte: startDate },
    }).sort({ date: 1 }).select('date users.dau').lean();
  }

  async getRetentionTrend(weeks = 12): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);
    return OperationalAnalytics.find({
      period: 'weekly',
      date: { $gte: startDate },
    }).sort({ date: 1 }).select('date retention').lean();
  }

  async aggregateWeek(): Promise<any> {
    const weekStart = this.getWeekStart();
    const days = await OperationalAnalytics.find({
      period: 'daily',
      date: { $gte: weekStart },
    }).lean();
    const aggregated = this.aggregatePeriod(days);
    return OperationalAnalytics.findOneAndUpdate(
      { date: weekStart, period: 'weekly' },
      { $set: aggregated },
      { upsert: true, new: true },
    );
  }

  async aggregateMonth(year: number, month: number): Promise<any> {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const days = await OperationalAnalytics.find({
      period: 'daily',
      date: { $gte: monthStart, $lte: monthEnd },
    }).lean();
    const aggregated = this.aggregatePeriod(days);
    return OperationalAnalytics.findOneAndUpdate(
      { date: monthStart, period: 'monthly' },
      { $set: aggregated },
      { upsert: true, new: true },
    );
  }

  private aggregatePeriod(days: any[]): any {
    if (!days.length) return {};
    return {
      users: {
        dau: Math.max(...days.map(d => d.users?.dau || 0)),
        mau: days[days.length - 1]?.users?.mau || 0,
        newUsers: days.reduce((sum, d) => sum + (d.users?.newUsers || 0), 0),
        returningUsers: days.reduce((sum, d) => sum + (d.users?.returningUsers || 0), 0),
      },
      tasks: {
        created: days.reduce((sum, d) => sum + (d.tasks?.created || 0), 0),
        completed: days.reduce((sum, d) => sum + (d.tasks?.completed || 0), 0),
      },
      rewards: {
        earned: days.reduce((sum, d) => sum + (d.rewards?.earned || 0), 0),
        redeemed: days.reduce((sum, d) => sum + (d.rewards?.redeemed || 0), 0),
      },
    };
  }

  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}

export async function getFamilyAnalytics(familyId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return AnalyticsEngine.getFamilyAnalytics(familyId, startDate, endDate);
}

export async function getAdminAnalytics() {
  const [totalUsers, totalTasks, totalRewards, activeUsers] = await Promise.all([
    User.countDocuments(),
    Task.countDocuments(),
    Reward.countDocuments(),
    User.countDocuments({ isActive: true }),
  ]);

  const latestSummary = await OperationalAnalytics.findOne({ period: 'daily' })
    .sort({ date: -1 })
    .lean();

  return {
    summary: {
      totalUsers,
      activeUsers,
      totalTasks,
      totalRewards,
    },
    latestMetrics: latestSummary || null,
  };
}
