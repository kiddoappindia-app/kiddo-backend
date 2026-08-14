import { Schema, model, Types } from 'mongoose';

const habitSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitType: {
      type: String,
      enum: [
        'task_completion', 'homework_completion', 'reading', 'exercise',
        'attendance', 'morning_routine', 'evening_routine', 'study_time',
        'screen_time', 'chores', 'kindness', 'creativity',
      ],
      required: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    totalEvents: { type: Number, default: 0 },
    completedEvents: { type: Number, default: 0 },
    missedEvents: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 },
    consistency: { type: Number, default: 0, min: 0, max: 100 },
    trend: { type: String, enum: ['improving', 'stable', 'declining', 'new'], default: 'new' },
    previousPeriodRate: { type: Number, default: 0 },
    changePercent: { type: Number, default: 0 },
    difficultyTrend: { type: String, enum: ['easier', 'same', 'harder', 'unknown'], default: 'unknown' },
    bestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

habitSnapshotSchema.index({ userId: 1, habitType: 1, period: 1, periodStart: -1 });
habitSnapshotSchema.index({ userId: 1, period: 1, periodStart: -1 });

export const HabitSnapshot = model('HabitSnapshot', habitSnapshotSchema);
