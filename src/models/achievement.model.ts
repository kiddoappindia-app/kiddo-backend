import { Schema, model, Types } from 'mongoose';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
export type AchievementCategory = 'tasks' | 'streaks' | 'wallet' | 'social' | 'special' | 'milestone';

export interface IAchievementDefinition extends Document {
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  requiredCount: number;
  metricType: string;
  rewardCoins: number;
  rewardXp: number;
  rewardStars: number;
  rewardTitle?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const achievementDefinitionSchema = new Schema<IAchievementDefinition>(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['tasks', 'streaks', 'wallet', 'social', 'special', 'milestone'],
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'diamond', 'legendary'],
      required: true,
    },
    icon: { type: String, default: '🏆' },
    requiredCount: { type: Number, required: true, min: 1 },
    metricType: { type: String, required: true },
    rewardCoins: { type: Number, default: 0 },
    rewardXp: { type: Number, default: 0 },
    rewardStars: { type: Number, default: 0 },
    rewardTitle: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AchievementDefinition = model<IAchievementDefinition>('AchievementDefinition', achievementDefinitionSchema);

export interface IChildAchievement extends Document {
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  achievementId: Types.ObjectId;
  unlockedAt: Date;
  progress: number;
  isClaimed: boolean;
  claimedAt?: Date;
  createdAt: Date;
}

const childAchievementSchema = new Schema<IChildAchievement>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    achievementId: { type: Schema.Types.ObjectId, ref: 'AchievementDefinition', required: true },
    unlockedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 100 },
    isClaimed: { type: Boolean, default: false },
    claimedAt: { type: Date },
  },
  { timestamps: true },
);

childAchievementSchema.index({ childId: 1, achievementId: 1 }, { unique: true });

export const ChildAchievement = model<IChildAchievement>('ChildAchievement', childAchievementSchema);
