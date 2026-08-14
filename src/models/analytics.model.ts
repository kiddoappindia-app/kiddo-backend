import { Schema, model, Types } from 'mongoose';

export interface IRewardConfig extends Document {
  familyId: Types.ObjectId;
  basePointsPerTask: number;
  difficultyMultipliers: {
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  };
  speedBonusThreshold: number;
  speedBonusMultiplier: number;
  morningBonusStart: number;
  morningBonusEnd: number;
  morningBonusPoints: number;
  weekendBonusPoints: number;
  holidayBonusPoints: number;
  streakBonuses: {
    '3': number;
    '5': number;
    '7': number;
    '14': number;
    '21': number;
    '30': number;
  };
  perfectDayBonus: number;
  perfectWeekBonus: number;
  perfectMonthBonus: number;
  teacherBonusMultiplier: number;
  parentBonusMultiplier: number;
  coinsPerPoint: number;
  xpPerPoint: number;
  energyPerTask: number;
  maxDailyEnergy: number;
  energyRegenPerHour: number;
  createdAt: Date;
  updatedAt: Date;
}

const rewardConfigSchema = new Schema<IRewardConfig>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, unique: true },
    basePointsPerTask: { type: Number, default: 20, min: 0 },
    difficultyMultipliers: {
      easy: { type: Number, default: 0.8 },
      medium: { type: Number, default: 1.0 },
      hard: { type: Number, default: 1.5 },
      expert: { type: Number, default: 2.0 },
    },
    speedBonusThreshold: { type: Number, default: 15 },
    speedBonusMultiplier: { type: Number, default: 1.5 },
    morningBonusStart: { type: Number, default: 6 },
    morningBonusEnd: { type: Number, default: 9 },
    morningBonusPoints: { type: Number, default: 10 },
    weekendBonusPoints: { type: Number, default: 5 },
    holidayBonusPoints: { type: Number, default: 10 },
    streakBonuses: {
      '3': { type: Number, default: 5 },
      '5': { type: Number, default: 15 },
      '7': { type: Number, default: 25 },
      '14': { type: Number, default: 50 },
      '21': { type: Number, default: 75 },
      '30': { type: Number, default: 100 },
    },
    perfectDayBonus: { type: Number, default: 30 },
    perfectWeekBonus: { type: Number, default: 100 },
    perfectMonthBonus: { type: Number, default: 500 },
    teacherBonusMultiplier: { type: Number, default: 1.2 },
    parentBonusMultiplier: { type: Number, default: 1.1 },
    coinsPerPoint: { type: Number, default: 0.5 },
    xpPerPoint: { type: Number, default: 1.0 },
    energyPerTask: { type: Number, default: 10 },
    maxDailyEnergy: { type: Number, default: 100 },
    energyRegenPerHour: { type: Number, default: 10 },
  },
  { timestamps: true },
);

export const RewardConfig = model<IRewardConfig>('FamilyRewardConfig', rewardConfigSchema);

export interface IAnalyticsSnapshot extends Document {
  familyId: Types.ObjectId;
  childId: Types.ObjectId;
  date: Date;
  tasksCompleted: number;
  tasksAssigned: number;
  tasksMissed: number;
  tasksLate: number;
  completionRate: number;
  totalPointsEarned: number;
  totalCoinsEarned: number;
  totalXpEarned: number;
  streakDays: number;
  longestStreak: number;
  avgCompletionMinutes: number;
  favoriteCategory: string;
  difficultyDistribution: Record<string, number>;
  dailyMetrics: {
    date: Date;
    completed: number;
    points: number;
    xp: number;
  }[];
  createdAt: Date;
}

const analyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    tasksCompleted: { type: Number, default: 0 },
    tasksAssigned: { type: Number, default: 0 },
    tasksMissed: { type: Number, default: 0 },
    tasksLate: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    totalCoinsEarned: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    avgCompletionMinutes: { type: Number, default: 0 },
    favoriteCategory: { type: String, default: '' },
    difficultyDistribution: { type: Schema.Types.Mixed, default: {} },
    dailyMetrics: [{
      date: Date,
      completed: Number,
      points: Number,
      xp: Number,
    }],
  },
  { timestamps: true },
);

analyticsSnapshotSchema.index({ childId: 1, date: -1 });
analyticsSnapshotSchema.index({ familyId: 1, date: -1 });

export const AnalyticsSnapshot = model<IAnalyticsSnapshot>('AnalyticsSnapshot', analyticsSnapshotSchema);
