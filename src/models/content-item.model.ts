import { Schema, model } from 'mongoose';

export type ContentType =
  | 'avatar_item' | 'pet' | 'furniture' | 'achievement' | 'challenge'
  | 'task_template' | 'reward_template' | 'school_template' | 'reading_challenge'
  | 'exercise_challenge' | 'store_inventory' | 'announcement' | 'quote'
  | 'animation' | 'badge' | 'certificate' | 'theme' | 'asset';

export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

const contentItemSchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['draft', 'review', 'published', 'archived'], default: 'draft', index: true },
    version: { type: Number, default: 1 },
    data: { type: Schema.Types.Mixed, required: true },
    tags: [{ type: String }],
    thumbnail: { type: String },
    assets: [{ type: String }],
    metadata: {
      difficulty: { type: String },
      points: { type: Number },
      xp: { type: Number },
      coins: { type: Number },
      category: { type: String },
      level: { type: Number },
      estimatedMinutes: { type: Number },
      subjects: [String],
    },
    targetAudience: {
      ageMin: { type: Number },
      ageMax: { type: Number },
      roles: [String],
      schools: [{ type: Schema.Types.ObjectId, ref: 'School' }],
    },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

contentItemSchema.index({ type: 1, status: 1 });
contentItemSchema.index({ type: 1, tags: 1 });

export const ContentItem = model('ContentItem', contentItemSchema);
