import { Schema, model } from 'mongoose';

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';

const experimentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    status: { type: String, enum: ['draft', 'running', 'paused', 'completed', 'archived'], default: 'draft' },
    hypothesis: { type: String },
    category: { type: String, enum: ['reward', 'ui', 'engagement', 'notification', 'store', 'task', 'avatar', 'other'], required: true },
    variants: [{
      name: { type: String, required: true },
      description: String,
      weight: { type: Number, required: true },
      config: { type: Schema.Types.Mixed, required: true },
      isControl: { type: Boolean, default: false },
    }],
    targeting: {
      percentage: { type: Number, default: 100, min: 0, max: 100 },
      schools: [{ type: Schema.Types.ObjectId, ref: 'School' }],
      roles: [String],
      minLevel: Number,
      maxLevel: Number,
    },
    metrics: {
      primary: { type: String, required: true },
      secondary: [String],
    },
    results: {
      participants: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      variantResults: [{
        variant: String,
        participants: Number,
        conversions: Number,
        engagement: Number,
        retention: Number,
      }],
    },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

experimentSchema.index({ status: 1, category: 1 });

export const Experiment = model('Experiment', experimentSchema);
