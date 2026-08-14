import { Schema, model, Types } from 'mongoose';

export interface IWallet extends Document {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  coins: number;
  points: number;
  xp: number;
  energy: number;
  stars: number;
  gems: number;
  lifetimeCoins: number;
  lifetimePoints: number;
  lifetimeXp: number;
  lifetimeStars: number;
  totalSpent: number;
  level: number;
  status: 'active' | 'frozen' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    coins: { type: Number, default: 0, min: 0 },
    points: { type: Number, default: 0, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    energy: { type: Number, default: 100, min: 0, max: 100 },
    stars: { type: Number, default: 0, min: 0 },
    gems: { type: Number, default: 0, min: 0 },
    lifetimeCoins: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    lifetimeXp: { type: Number, default: 0 },
    lifetimeStars: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'frozen', 'suspended'], default: 'active' },
  },
  { timestamps: true },
);

walletSchema.index({ childId: 1 });
walletSchema.index({ familyId: 1 });

export const Wallet = model<IWallet>('WalletV2', walletSchema);
