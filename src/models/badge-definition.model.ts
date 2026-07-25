import { Schema, model, Types } from 'mongoose';

export interface IBadgeDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achievementId?: Types.ObjectId;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const badgeDefinitionSchema = new Schema<IBadgeDefinition>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'badge' },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    achievementId: { type: Schema.Types.ObjectId, ref: 'AchievementDefinition' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

badgeDefinitionSchema.index({ rarity: 1, sortOrder: 1 });
badgeDefinitionSchema.index({ isActive: 1 });

export const BadgeDefinition = model<IBadgeDefinition>('BadgeDefinition', badgeDefinitionSchema);
