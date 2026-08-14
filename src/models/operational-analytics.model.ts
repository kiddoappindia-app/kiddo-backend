import { Schema, model } from 'mongoose';

const operationalAnalyticsSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    users: {
      dau: { type: Number, default: 0 },
      wau: { type: Number, default: 0 },
      mau: { type: Number, default: 0 },
      newUsers: { type: Number, default: 0 },
      returningUsers: { type: Number, default: 0 },
      churnedUsers: { type: Number, default: 0 },
    },
    retention: {
      day1: { type: Number, default: 0 },
      day7: { type: Number, default: 0 },
      day30: { type: Number, default: 0 },
    },
    engagement: {
      avgSessionMinutes: { type: Number, default: 0 },
      avgTasksPerUser: { type: Number, default: 0 },
      avgRewardsPerUser: { type: Number, default: 0 },
      totalSessions: { type: Number, default: 0 },
    },
    tasks: {
      created: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      avgCompletionTime: { type: Number, default: 0 },
    },
    homework: {
      assigned: { type: Number, default: 0 },
      submitted: { type: Number, default: 0 },
      submissionRate: { type: Number, default: 0 },
      avgGrade: { type: Number, default: 0 },
    },
    rewards: {
      earned: { type: Number, default: 0 },
      redeemed: { type: Number, default: 0 },
      totalCoins: { type: Number, default: 0 },
      totalXp: { type: Number, default: 0 },
    },
    store: {
      purchases: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      topItems: [{ itemId: Schema.Types.ObjectId, name: String, count: Number }],
    },
    teacher: {
      activeTeachers: { type: Number, default: 0 },
      assignmentsCreated: { type: Number, default: 0 },
      gradesGiven: { type: Number, default: 0 },
      messagesSent: { type: Number, default: 0 },
    },
    parent: {
      activeParents: { type: Number, default: 0 },
      approvalsGiven: { type: Number, default: 0 },
      tasksCreated: { type: Number, default: 0 },
    },
    features: {
      feature: { type: Map, of: Number },
    },
    health: {
      crashRate: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      uptime: { type: Number, default: 100 },
    },
  },
  { timestamps: true },
);

operationalAnalyticsSchema.index({ date: 1, period: 1 });
operationalAnalyticsSchema.index({ period: 1, date: -1 });

export const OperationalAnalytics = model('OperationalAnalytics', operationalAnalyticsSchema);
