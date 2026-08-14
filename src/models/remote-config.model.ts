import { Schema, model } from 'mongoose';

export type ConfigScope = 'global' | 'school' | 'family' | 'user';

const remoteConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    type: { type: String, enum: ['string', 'number', 'boolean', 'json', 'array'], required: true },
    scope: { type: String, enum: ['global', 'school', 'family', 'user'], default: 'global' },
    scopeId: { type: Schema.Types.ObjectId, index: true },
    category: { type: String, enum: ['feature', 'limits', 'theme', 'reward', 'seasonal', 'maintenance', 'notification'], required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    startAt: { type: Date },
    endAt: { type: Date },
    priority: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changeLog: [
      {
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],
  },
  { timestamps: true },
);

remoteConfigSchema.index({ key: 1, scope: 1, scopeId: 1 });
remoteConfigSchema.index({ category: 1, enabled: 1 });

export const RemoteConfig = model('RemoteConfig', remoteConfigSchema);
