import { Schema, model, Types } from 'mongoose';

export type TransactionType = 'task_reward' | 'purchase' | 'penalty' | 'gift' | 'adjustment' | 'bonus' | 'transfer' | 'refund' | 'achievement' | 'streak' | 'daily_login' | 'store_redemption';

export interface IWalletTransaction extends Document {
  walletId: Types.ObjectId;
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  type: TransactionType;
  currency: 'coins' | 'points' | 'xp' | 'energy' | 'stars' | 'gems';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: Types.ObjectId;
  referenceModel?: string;
  description: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    type: {
      type: String,
      enum: ['task_reward', 'purchase', 'penalty', 'gift', 'adjustment', 'bonus', 'transfer', 'refund', 'achievement', 'streak', 'daily_login', 'store_redemption'],
      required: true,
      index: true,
    },
    currency: {
      type: String,
      enum: ['coins', 'points', 'xp', 'energy', 'stars', 'gems'],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    referenceModel: { type: String },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ childId: 1, type: 1, createdAt: -1 });
walletTransactionSchema.index({ childId: 1, currency: 1, createdAt: -1 });

export const WalletTransaction = model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);
