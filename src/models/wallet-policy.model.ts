import { Schema, model, Types } from 'mongoose';

export interface IWalletPolicy {
  childId: Types.ObjectId;
  dailySpendingLimit: number | null;
  weeklySpendingLimit: number | null;
  monthlySpendingLimit: number | null;
  maximumWalletBalance: number | null;
  maximumDailyRewardPoints: number | null;
  maximumDailyCoinConversion: number | null;
  updatedBy: Types.ObjectId;
}

const optionalLimit = { type: Number, default: null, min: 0 } as const;

const walletPolicySchema = new Schema<IWalletPolicy>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dailySpendingLimit: optionalLimit,
    weeklySpendingLimit: optionalLimit,
    monthlySpendingLimit: optionalLimit,
    maximumWalletBalance: optionalLimit,
    maximumDailyRewardPoints: optionalLimit,
    maximumDailyCoinConversion: optionalLimit,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const WalletPolicy = model<IWalletPolicy>('WalletPolicy', walletPolicySchema);
