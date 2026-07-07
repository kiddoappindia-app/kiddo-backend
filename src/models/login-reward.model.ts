import { Schema, model, Types } from 'mongoose';

export interface ILoginRewardConfig {
  dayNumber: number;
  rewards: {
    xp: number;
    points?: number;
    coins?: number;
  };
  isActive: boolean;
}

export interface ILoginRewardLog {
  userId: Types.ObjectId;
  loginDate: Date;
  dayNumber: number;
  xpAwarded: number;
  pointsAwarded: number;
  coinsAwarded: number;
  claimedAt: Date;
}

const loginRewardLogSchema = new Schema<ILoginRewardLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loginDate: { type: Date, required: true },
    dayNumber: { type: Number, required: true },
    xpAwarded: { type: Number, default: 0 },
    pointsAwarded: { type: Number, default: 0 },
    coinsAwarded: { type: Number, default: 0 },
    claimedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

loginRewardLogSchema.index({ userId: 1, loginDate: -1 });

export const LoginRewardLog = model<ILoginRewardLog>('LoginRewardLog', loginRewardLogSchema);
