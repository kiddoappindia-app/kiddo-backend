import { Schema, model, Types } from 'mongoose';

export type StreakType = 'morning_routine' | 'homework' | 'reading' | 'exercise' | 'healthy_eating' | 'sleep' | 'school_attendance' | 'perfect_day' | 'perfect_week' | 'perfect_month';

export interface IStreak extends Document {
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  streakType: StreakType;
  currentCount: number;
  longestCount: number;
  lastCompletedDate?: Date;
  startDate: Date;
  isActive: boolean;
  history: {
    date: Date;
    completed: boolean;
    count: number;
  }[];
  totalCompletions: number;
  createdAt: Date;
  updatedAt: Date;
}

const streakSchema = new Schema<IStreak>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    streakType: {
      type: String,
      enum: ['morning_routine', 'homework', 'reading', 'exercise', 'healthy_eating', 'sleep', 'school_attendance', 'perfect_day', 'perfect_week', 'perfect_month'],
      required: true,
    },
    currentCount: { type: Number, default: 0, min: 0 },
    longestCount: { type: Number, default: 0, min: 0 },
    lastCompletedDate: { type: Date },
    startDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    history: [{
      date: { type: Date, required: true },
      completed: { type: Boolean, required: true },
      count: { type: Number, required: true },
    }],
    totalCompletions: { type: Number, default: 0 },
  },
  { timestamps: true },
);

streakSchema.index({ childId: 1, streakType: 1 }, { unique: true });
streakSchema.index({ familyId: 1, isActive: 1 });

export const Streak = model<IStreak>('Streak', streakSchema);
