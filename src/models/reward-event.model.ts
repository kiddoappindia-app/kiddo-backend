import { Schema, model, Types } from 'mongoose';

export interface IRewardEvent {
  childId: Types.ObjectId;
  action: string;
  points: number;
  ruleId: Types.ObjectId | null;
  source: string;
  sourceId: string | null;
  multiplier: number;
  totalPoints: number;
  campaignId: Types.ObjectId | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

const rewardEventSchema = new Schema<IRewardEvent>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    points: { type: Number, required: true, default: 0 },
    ruleId: { type: Schema.Types.ObjectId, ref: 'RewardRule', default: null },
    source: { type: String, required: true, default: 'system' },
    sourceId: { type: String, default: null },
    multiplier: { type: Number, default: 1.0 },
    totalPoints: { type: Number, required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'RewardCampaign', default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

rewardEventSchema.index({ childId: 1, createdAt: -1 });
rewardEventSchema.index({ childId: 1, action: 1, createdAt: -1 });
rewardEventSchema.index({ sourceId: 1, action: 1 }, { unique: true, sparse: true });

export const RewardEvent = model<IRewardEvent>('RewardEvent', rewardEventSchema);
