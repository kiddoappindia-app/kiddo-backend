import { Schema, model, Types } from 'mongoose';

export interface IRewardRule {
  _id: Types.ObjectId;
  actionType: string;
  name: string;
  description: string;
  basePoints: number;
  isActive: boolean;
  frequency: 'once_per_day' | 'once_per_week' | 'once_per_month' | 'unlimited';
  maxPerDay: number;
  maxPerWeek: number;
  maxPerMonth: number;
  cooldown: number;
  minimumAge: number;
  maximumAge: number;
  applicableRoles: string[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rewardRuleSchema = new Schema<IRewardRule>(
  {
    actionType: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    basePoints: { type: Number, required: true, default: 10 },
    isActive: { type: Boolean, default: true },
    frequency: {
      type: String,
      enum: ['once_per_day', 'once_per_week', 'once_per_month', 'unlimited'],
      default: 'unlimited',
    },
    maxPerDay: { type: Number, default: 0 },
    maxPerWeek: { type: Number, default: 0 },
    maxPerMonth: { type: Number, default: 0 },
    cooldown: { type: Number, default: 0 },
    minimumAge: { type: Number, default: 0 },
    maximumAge: { type: Number, default: 0 },
    applicableRoles: { type: [String], default: ['child'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

rewardRuleSchema.index({ actionType: 1 });
rewardRuleSchema.index({ isActive: 1 });

export const RewardRule = model<IRewardRule>('RewardRule', rewardRuleSchema);
