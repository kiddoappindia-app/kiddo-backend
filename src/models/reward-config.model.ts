import { Schema, model } from 'mongoose';

const rewardConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    formula: {
      base: { type: Number, required: true },
      multipliers: {
        difficulty: { type: Map, of: Number },
        streak: { type: Map, of: Number },
        holiday: { type: Number, default: 1 },
        school: { type: Number, default: 1 },
        family: { type: Number, default: 1 },
      },
      bonuses: {
        perfectWeek: { type: Number, default: 0 },
        perfectMonth: { type: Number, default: 0 },
        firstTime: { type: Number, default: 0 },
        comeback: { type: Number, default: 0 },
      },
      caps: {
        dailyMax: { type: Number },
        weeklyMax: { type: Number },
        perTaskMax: { type: Number },
      },
    },
    category: { type: String, enum: ['task', 'homework', 'reading', 'exercise', 'attendance', 'pet', 'store', 'general'], required: true },
    experiments: [{
      experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment' },
      variant: String,
      weight: Number,
    }],
    scope: { type: String, enum: ['global', 'school', 'family'], default: 'global' },
    scopeId: { type: Schema.Types.ObjectId },
    effectiveFrom: { type: Date },
    effectiveUntil: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

rewardConfigSchema.index({ category: 1, enabled: 1 });
rewardConfigSchema.index({ scope: 1, scopeId: 1 });

export const RewardConfig = model('RewardConfig', rewardConfigSchema);
