import { InsightRule } from '../models/insight-rule.model.js';
import { GeneratedInsight } from '../models/generated-insight.model.js';
import { IntelligenceEvent } from '../models/intelligence-event.model.js';
import { HabitSnapshot } from '../models/habit-snapshot.model.js';
import { GrowthProfile } from '../models/growth-profile.model.js';
import { Types } from 'mongoose';

export class InsightEngineService {
  async evaluateRules(userId: string) {
    const rules = await InsightRule.find({ isActive: true }).sort({ priority: -1 });
    const generatedInsights: any[] = [];

    for (const rule of rules) {
      // Check cooldown
      if (rule.lastTriggeredAt) {
        const daysSinceLastTrigger = (Date.now() - rule.lastTriggeredAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastTrigger < rule.cooldownDays) continue;
      }

      const conditionsMet = await this.evaluateConditions(userId, rule);

      if (conditionsMet) {
        const insight = await this.generateInsight(userId, rule);
        if (insight) {
          generatedInsights.push(insight);
          rule.lastTriggeredAt = new Date();
          rule.triggerCount += 1;
          await rule.save();
        }
      }
    }

    return generatedInsights;
  }

  private async evaluateConditions(userId: string, rule: any): Promise<boolean> {
    const results = await Promise.all(
      rule.conditions.map((condition: any) => this.evaluateCondition(userId, condition)),
    );

    if (rule.logic === 'AND') {
      return results.every((r) => r);
    } else {
      return results.some((r) => r);
    }
  }

  private async evaluateCondition(userId: string, condition: any): Promise<boolean> {
    const { metric, operator, value, period } = condition;

    switch (metric) {
      case 'task_completion_rate': {
        const habit = await HabitSnapshot.findOne({
          userId: new Types.ObjectId(userId),
          habitType: 'task_completion',
          period,
        }).sort({ periodStart: -1 });
        return this.compare(habit?.completionRate || 0, operator, value);
      }
      case 'homework_completion_rate': {
        const habit = await HabitSnapshot.findOne({
          userId: new Types.ObjectId(userId),
          habitType: 'homework_completion',
          period,
        }).sort({ periodStart: -1 });
        return this.compare(habit?.completionRate || 0, operator, value);
      }
      case 'attendance_rate': {
        const habit = await HabitSnapshot.findOne({
          userId: new Types.ObjectId(userId),
          habitType: 'attendance',
          period,
        }).sort({ periodStart: -1 });
        return this.compare(habit?.completionRate || 0, operator, value);
      }
      case 'reading_minutes': {
        const events = await IntelligenceEvent.countDocuments({
          userId: new Types.ObjectId(userId),
          type: 'reading_session',
          timestamp: { $gte: this.getPeriodStart(period) },
        });
        return this.compare(events * 15, operator, value); // Assume 15 min per session
      }
      case 'growth_score': {
        const profile = await GrowthProfile.findOne({ userId: new Types.ObjectId(userId) });
        return this.compare(profile?.overallScore || 0, operator, value);
      }
      case 'growth_change': {
        const profile = await GrowthProfile.findOne({ userId: new Types.ObjectId(userId) });
        const change = (profile?.overallScore || 0) - (profile?.dimensions?.responsibility?.previousScore || 0);
        return this.compare(change, operator, value);
      }
      case 'streak_days': {
        const habit = await HabitSnapshot.findOne({
          userId: new Types.ObjectId(userId),
          habitType: 'task_completion',
          period: 'weekly',
        }).sort({ periodStart: -1 });
        return this.compare(habit?.currentStreak || 0, operator, value);
      }
      case 'consistency': {
        const habit = await HabitSnapshot.findOne({
          userId: new Types.ObjectId(userId),
          habitType: 'task_completion',
          period,
        }).sort({ periodStart: -1 });
        return this.compare(habit?.consistency || 0, operator, value);
      }
      default:
        return false;
    }
  }

  private compare(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      default: return false;
    }
  }

  private async generateInsight(userId: string, rule: any) {
    const existing = await GeneratedInsight.findOne({
      userId: new Types.ObjectId(userId),
      ruleId: rule._id,
      acknowledged: false,
    });

    if (existing) return null;

    return GeneratedInsight.create({
      userId: new Types.ObjectId(userId),
      ruleId: rule._id,
      type: rule.insight.type,
      title: rule.insight.title,
      message: rule.insight.message,
      severity: rule.insight.severity,
      icon: rule.insight.icon,
      category: rule.category,
      confidence: 1.0,
      actionable: !!rule.insight.actionLabel,
      actionLabel: rule.insight.actionLabel,
      actionRoute: rule.insight.actionRoute,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  async getInsights(userId: string, options?: { category?: string; acknowledged?: boolean; limit?: number }) {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (options?.category) query.category = options.category;
    if (options?.acknowledged !== undefined) query.acknowledged = options.acknowledged;
    return GeneratedInsight.find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 20);
  }

  async acknowledgeInsight(insightId: string) {
    return GeneratedInsight.findByIdAndUpdate(
      insightId,
      { acknowledged: true, acknowledgedAt: new Date() },
      { new: true },
    );
  }

  async createDefaultRules() {
    const defaultRules = [
      {
        name: 'Homework Attention',
        description: 'When homework completion drops below 60% for a week',
        category: 'homework',
        conditions: [{ metric: 'homework_completion_rate', operator: 'lt', value: 60, period: 'weekly' }],
        insight: {
          type: 'HOMEWORK_ATTENTION',
          title: 'Homework Needs Attention',
          message: 'Homework completion has dropped below 60% this week. Let\'s work together to get back on track!',
          severity: 'warning',
          icon: '📝',
        },
        targetRoles: ['parent', 'teacher'],
      },
      {
        name: 'Reading Improvement',
        description: 'When reading increases by 20% for 4 weeks',
        category: 'reading',
        conditions: [{ metric: 'reading_minutes', operator: 'gt', value: 120, period: 'monthly' }],
        insight: {
          type: 'READING_IMPROVEMENT',
          title: 'Reading is Improving!',
          message: 'Reading has increased consistently over the past month. Keep up the great work!',
          severity: 'success',
          icon: '📚',
        },
        targetRoles: ['parent', 'child'],
      },
      {
        name: 'Perfect Week',
        description: 'When task completion is 100% for a week',
        category: 'habit',
        conditions: [{ metric: 'task_completion_rate', operator: 'gte', value: 100, period: 'weekly' }],
        insight: {
          type: 'PERFECT_WEEK',
          title: 'Perfect Week!',
          message: 'You completed every task this week! Amazing job!',
          severity: 'success',
          icon: '⭐',
        },
        targetRoles: ['child', 'parent'],
      },
      {
        name: 'Attendance Alert',
        description: 'When attendance drops below 80%',
        category: 'attendance',
        conditions: [{ metric: 'attendance_rate', operator: 'lt', value: 80, period: 'weekly' }],
        insight: {
          type: 'ATTENDANCE_ALERT',
          title: 'Attendance Needs Attention',
          message: 'Attendance has dropped below 80% this week. Let\'s make sure we\'re present every day!',
          severity: 'attention',
          icon: '📅',
        },
        targetRoles: ['parent', 'teacher'],
      },
      {
        name: 'Consistency Champion',
        description: 'When consistency score is above 80%',
        category: 'habit',
        conditions: [{ metric: 'consistency', operator: 'gt', value: 80, period: 'weekly' }],
        insight: {
          type: 'CONSISTENCY_CHAMPION',
          title: 'Consistency Champion!',
          message: 'You\'ve been consistently active this week. That\'s how habits are built!',
          severity: 'success',
          icon: '🏆',
        },
        targetRoles: ['child'],
      },
      {
        name: 'Growth Milestone',
        description: 'When overall growth score increases by 10%',
        category: 'growth',
        conditions: [{ metric: 'growth_change', operator: 'gt', value: 5, period: 'monthly' }],
        insight: {
          type: 'GROWTH_MILESTONE',
          title: 'Growing Stronger!',
          message: 'Your overall growth score has improved significantly. You\'re making great progress!',
          severity: 'success',
          icon: '🌱',
        },
        targetRoles: ['child', 'parent'],
      },
    ];

    for (const rule of defaultRules) {
      const exists = await InsightRule.findOne({ name: rule.name });
      if (!exists) {
        await InsightRule.create(rule);
      }
    }
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now);
    }
  }
}
