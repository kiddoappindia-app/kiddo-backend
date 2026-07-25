import { Schema, model, Types } from 'mongoose';

export interface IRewardConversion {
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  rewardPointsUsed: number;
  redeemCoinsAwarded: number;
  conversionRatio: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string;
  parentApprovalRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rewardConversionSchema = new Schema<IRewardConversion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    rewardPointsUsed: { type: Number, required: true, min: 1000 },
    redeemCoinsAwarded: { type: Number, required: true, min: 1 },
    conversionRatio: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    parentApprovalRequired: { type: Boolean, default: false },
  },
  { timestamps: true },
);

rewardConversionSchema.index({ userId: 1, status: 1 });
rewardConversionSchema.index({ userId: 1, createdAt: -1 });

export const RewardConversion = model<IRewardConversion>('RewardConversion', rewardConversionSchema);
