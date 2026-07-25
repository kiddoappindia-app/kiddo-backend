import { Schema, model } from 'mongoose';

export interface IRewardSettings {
  key: string;
  value: number | string | boolean;
  description: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSettingsSchema = new Schema<IRewardSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, default: '' },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true },
);

export const RewardSettings = model<IRewardSettings>('RewardSettings', rewardSettingsSchema);
