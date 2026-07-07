import { Schema, model, Types } from 'mongoose';

export interface IChallenge {
  key: string;
  title: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  startDate: Date;
  endDate: Date;
  criteria: {
    type: 'task_count' | 'game_wins' | 'game_count' | 'xp_earn' | 'points_earn'
        | 'coins_earn' | 'streak_days' | 'login_days' | 'quiz_score' | 'reading_goals'
        | 'attendance_days' | 'habit_completions';
    value: number;
    gameType?: 'chess' | 'memory' | 'math' | 'pattern' | 'puzzle';
  };
  rewards: {
    xp: number;
    points?: number;
    coins?: number;
  };
  isActive: boolean;
  isRecurring: boolean;
  seasonName?: string;
  sortOrder: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const challengeSchema = new Schema<IChallenge>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'challenge' },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'seasonal'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    criteria: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
      gameType: { type: String, enum: ['chess', 'memory', 'math', 'pattern', 'puzzle'] },
    },
    rewards: {
      xp: { type: Number, default: 100 },
      points: { type: Number },
      coins: { type: Number },
    },
    isActive: { type: Boolean, default: true },
    isRecurring: { type: Boolean, default: false },
    seasonName: { type: String },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

challengeSchema.index({ type: 1, isActive: 1, startDate: 1, endDate: 1 });

export const Challenge = model<IChallenge>('Challenge', challengeSchema);
