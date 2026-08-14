import { Schema, model } from 'mongoose';

export type FlagScope = 'global' | 'school' | 'family' | 'user';

const featureFlagSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: false },
    category: { type: String, enum: ['core', 'avatar', 'pets', 'store', 'teacher', 'gamification', 'seasonal', 'notifications', 'ai', 'experimental'], required: true },
    rollout: {
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      scope: { type: String, enum: ['global', 'school', 'family', 'user'], default: 'global' },
      scopeIds: [Schema.Types.ObjectId],
      whitelist: [Schema.Types.ObjectId],
      blacklist: [Schema.Types.ObjectId],
    },
    metadata: {
      owner: String,
      ticket: String,
      createdAt: Date,
      expiresAt: Date,
    },
    variants: [{
      name: String,
      weight: Number,
      config: Schema.Types.Mixed,
    }],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changeLog: [{
      enabled: Boolean,
      percentage: Number,
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
      reason: String,
    }],
  },
  { timestamps: true },
);

featureFlagSchema.index({ category: 1, enabled: 1 });

export const FeatureFlag = model('FeatureFlag', featureFlagSchema);
