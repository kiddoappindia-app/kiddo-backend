import { Schema, model, Types } from 'mongoose';

export const TRANSACTION_ACTION_TYPES = [
  'task_completed',
  'homework_completed',
  'learning_activity',
  'teacher_assignment',
  'parent_assignment',
  'quiz_completion',
  'puzzle_completion',
  'game_achievement',
  'reading_goal',
  'habit_tracking',
  'attendance_reward',
  'daily_login',
  'weekly_streak',
  'monthly_challenge',
  'parent_bonus',
  'teacher_bonus',
  'admin_promotion',
  'conversion_to_coins',
  'purchase',
  'refund',
  'admin_adjustment',
  'gift_received',
  'gift_sent',
  'teacher_attendance',
  'teacher_homework',
  'teacher_quiz',
  'teacher_behaviour',
  'teacher_participation',
  'teacher_reading',
  'teacher_challenge',
  'campaign_bonus',
  'achievement_reward',
  'login_reward',
  'challenge_reward',
  'streak_bonus',
] as const;

export type TransactionActionType = (typeof TRANSACTION_ACTION_TYPES)[number];

export interface IRewardTransaction {
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  actionType: TransactionActionType;
  rewardPoints: number;
  redeemCoins: number;
  balanceBefore: { rewardPoints: number; redeemCoins: number };
  balanceAfter: { rewardPoints: number; redeemCoins: number };
  description: string;
  referenceId: Types.ObjectId | null;
  referenceType: string | null;
  createdBy: Types.ObjectId | null;
  source: 'system' | 'parent' | 'teacher' | 'admin' | 'child';
  metadata: Record<string, unknown>;
}

const rewardTransactionSchema = new Schema<IRewardTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    actionType: { type: String, enum: TRANSACTION_ACTION_TYPES, required: true, index: true },
    rewardPoints: { type: Number, required: true, default: 0 },
    redeemCoins: { type: Number, required: true, default: 0 },
    balanceBefore: {
      rewardPoints: { type: Number, required: true },
      redeemCoins: { type: Number, required: true },
    },
    balanceAfter: {
      rewardPoints: { type: Number, required: true },
      redeemCoins: { type: Number, required: true },
    },
    description: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    referenceType: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    source: {
      type: String,
      enum: ['system', 'parent', 'teacher', 'admin', 'child'],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

rewardTransactionSchema.index({ userId: 1, createdAt: -1 });
rewardTransactionSchema.index({ actionType: 1, createdAt: -1 });

export const RewardTransaction = model<IRewardTransaction>('RewardTransaction', rewardTransactionSchema);
