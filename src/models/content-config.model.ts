import mongoose, { Schema, Document } from 'mongoose';

export interface IContentConfig extends Document {
  key: string;
  type: string;
  category: string;
  data: any;
  version: number;
  isActive: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  metadata: {
    author: string;
    lastModifiedBy: string;
    tags: string[];
    locale: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentConfigSchema = new Schema<IContentConfig>({
  key: { type: String, required: true, unique: true },
  type: { type: String, enum: ['avatar_items', 'events', 'challenges', 'rewards', 'animations', 'pets', 'store_inventory', 'furniture', 'world_areas', 'daily_journey', 'achievements', 'badges', 'missions', 'milestones'], required: true },
  category: { type: String, default: 'general' },
  data: { type: Schema.Types.Mixed, required: true },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date },
  expiresAt: { type: Date },
  metadata: {
    author: { type: String, default: 'system' },
    lastModifiedBy: { type: String, default: 'system' },
    tags: [{ type: String }],
    locale: { type: String, default: 'en' },
  },
}, { timestamps: true });

ContentConfigSchema.index({ type: 1, isActive: 1 });
ContentConfigSchema.index({ key: 1, version: -1 });

export const ContentConfig = mongoose.model<IContentConfig>('ContentConfig', ContentConfigSchema);

export interface IAnimationConfig extends Document {
  id: string;
  name: string;
  category: string;
  assetPath: string;
  thumbnail: string;
  duration: number;
  loop: boolean;
  rarity: string;
  unlockLevel: number;
  coinCost: number;
  isAvailable: boolean;
  seasonalEvent?: string;
  tags: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnimationConfigSchema = new Schema<IAnimationConfig>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['emote', 'idle', 'victory', 'walking', 'celebration', 'interaction', 'effect'], required: true },
  assetPath: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  duration: { type: Number, default: 1000 },
  loop: { type: Boolean, default: false },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary', 'mythic'], default: 'common' },
  unlockLevel: { type: Number, default: 1 },
  coinCost: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  seasonalEvent: { type: String },
  tags: [{ type: String }],
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

AnimationConfigSchema.index({ category: 1, isAvailable: 1 });

export const AnimationConfig = mongoose.model<IAnimationConfig>('AnimationConfig', AnimationConfigSchema);
