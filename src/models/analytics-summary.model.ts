import { Schema, model, Types } from 'mongoose';

const dailySummarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    eventsCount: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    tasksMissed: { type: Number, default: 0 },
    homeworkSubmitted: { type: Number, default: 0 },
    homeworkGraded: { type: Number, default: 0 },
    attendanceStatus: { type: String },
    readingMinutes: { type: Number, default: 0 },
    exerciseMinutes: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    achievementsUnlocked: { type: Number, default: 0 },
    growthScoreChange: { type: Number, default: 0 },
    dimensionChanges: { type: Schema.Types.Mixed },
    habits: { type: Schema.Types.Mixed },
    topCategories: [{ type: String, count: Number }],
  },
  { timestamps: true },
);

dailySummarySchema.index({ userId: 1, date: -1 }, { unique: true });

export const DailySummary = model('DailySummary', dailySummarySchema);

const weeklySummarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    daysActive: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    tasksMissed: { type: Number, default: 0 },
    homeworkCompleted: { type: Number, default: 0 },
    homeworkTotal: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    readingMinutes: { type: Number, default: 0 },
    exerciseMinutes: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    achievementsUnlocked: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    overallGrowthScore: { type: Number, default: 0 },
    growthChange: { type: Number, default: 0 },
    dimensionScores: { type: Schema.Types.Mixed },
    dimensionChanges: { type: Schema.Types.Mixed },
    habitSummaries: { type: Schema.Types.Mixed },
    highlights: [{ type: String }],
    lowlights: [{ type: String }],
    topPerformingDimension: { type: String },
    needsAttentionDimension: { type: String },
  },
  { timestamps: true },
);

weeklySummarySchema.index({ userId: 1, weekStart: -1 }, { unique: true });

export const WeeklySummary = model('WeeklySummary', weeklySummarySchema);

const monthlySummarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    daysActive: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    tasksMissed: { type: Number, default: 0 },
    homeworkCompleted: { type: Number, default: 0 },
    homeworkTotal: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    readingMinutes: { type: Number, default: 0 },
    exerciseMinutes: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    achievementsUnlocked: { type: Number, default: 0 },
    overallGrowthScore: { type: Number, default: 0 },
    growthChange: { type: Number, default: 0 },
    dimensionScores: { type: Schema.Types.Mixed },
    weeklyTrend: [{ weekStart: Date, score: Number }],
    habitSummaries: { type: Schema.Types.Mixed },
    highlights: [{ type: String }],
    lowlights: [{ type: String }],
    milestonesAchieved: [{ type: String, title: String, date: Date }],
  },
  { timestamps: true },
);

monthlySummarySchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const MonthlySummary = model('MonthlySummary', monthlySummarySchema);
