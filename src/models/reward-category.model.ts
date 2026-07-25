import { Schema, model, Types } from 'mongoose';

export interface IRewardCategory {
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl: string;
  type: 'avatar_customization' | 'goodies' | 'physical_rewards';
  sortOrder: number;
  isActive: boolean;
  parentId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const rewardCategorySchema = new Schema<IRewardCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    type: {
      type: String,
      enum: ['avatar_customization', 'goodies', 'physical_rewards'],
      required: true,
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'RewardCategory', default: null },
  },
  { timestamps: true },
);

export const RewardCategory = model<IRewardCategory>('RewardCategory', rewardCategorySchema);
