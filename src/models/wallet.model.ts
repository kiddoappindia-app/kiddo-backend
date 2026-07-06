import { Schema, model, Types } from 'mongoose';

export type WalletStatus = 'active' | 'frozen' | 'suspended';

export interface IWallet {
  childId: Types.ObjectId;
  rewardPoints: number;
  redeemCoins: number;
  lifetimeRewardPointsEarned: number;
  lifetimeRedeemCoinsEarned: number;
  lifetimeCoinsSpent: number;
  totalConversions: number;
  pointsConverted: number;
  pendingConversions: number;
  currentLevel: number;
  experience: number;
  status: WalletStatus;
  dailyConversionUsed: number;
  weeklyConversionUsed: number;
  monthlyConversionUsed: number;
  lastConversionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rewardPoints: { type: Number, default: 0, min: 0 },
    redeemCoins: { type: Number, default: 0, min: 0 },
    lifetimeRewardPointsEarned: { type: Number, default: 0 },
    lifetimeRedeemCoinsEarned: { type: Number, default: 0 },
    lifetimeCoinsSpent: { type: Number, default: 0 },
    totalConversions: { type: Number, default: 0 },
    pointsConverted: { type: Number, default: 0 },
    pendingConversions: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'frozen', 'suspended'], default: 'active' },
    dailyConversionUsed: { type: Number, default: 0 },
    weeklyConversionUsed: { type: Number, default: 0 },
    monthlyConversionUsed: { type: Number, default: 0 },
    lastConversionDate: { type: Date, default: null },
  },
  { timestamps: true },
);

walletSchema.index({ childId: 1 });
walletSchema.index({ status: 1 });

export const Wallet = model<IWallet>('Wallet', walletSchema);
