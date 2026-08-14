import { Schema, model, Types } from 'mongoose';

const growthDimensionSchema = new Schema({
  name: { type: String, required: true },
  score: { type: Number, default: 0, min: 0, max: 100 },
  previousScore: { type: Number, default: 0 },
  trend: { type: String, enum: ['improving', 'stable', 'declining', 'new'], default: 'new' },
  eventsCount: { type: Number, default: 0 },
  lastActivityAt: { type: Date },
  history: [{
    date: { type: Date },
    score: { type: Number },
  }],
}, { _id: false });

const growthProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    overallTrend: { type: String, enum: ['improving', 'stable', 'declining', 'new'], default: 'new' },
    level: { type: Number, default: 1 },
    totalEvents: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now },
    dimensions: {
      responsibility: { type: growthDimensionSchema, default: () => ({ name: 'responsibility' }) },
      reading: { type: growthDimensionSchema, default: () => ({ name: 'reading' }) },
      learning: { type: growthDimensionSchema, default: () => ({ name: 'learning' }) },
      fitness: { type: growthDimensionSchema, default: () => ({ name: 'fitness' }) },
      health: { type: growthDimensionSchema, default: () => ({ name: 'health' }) },
      kindness: { type: growthDimensionSchema, default: () => ({ name: 'kindness' }) },
      creativity: { type: growthDimensionSchema, default: () => ({ name: 'creativity' }) },
      focus: { type: growthDimensionSchema, default: () => ({ name: 'focus' }) },
      independence: { type: growthDimensionSchema, default: () => ({ name: 'independence' }) },
      consistency: { type: growthDimensionSchema, default: () => ({ name: 'consistency' }) },
    },
    milestones: [{
      type: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String },
      achievedAt: { type: Date, default: Date.now },
      metadata: { type: Schema.Types.Mixed },
    }],
    weeklySnapshots: [{
      weekStart: { type: Date },
      overallScore: { type: Number },
      dimensions: { type: Schema.Types.Mixed },
      eventsCount: { type: Number },
    }],
  },
  { timestamps: true },
);

export const GrowthProfile = model('GrowthProfile', growthProfileSchema);
