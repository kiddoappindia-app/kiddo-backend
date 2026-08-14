import { Schema, model, Types } from 'mongoose';

const generatedInsightSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'InsightRule' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'success', 'warning', 'attention'], default: 'info' },
    icon: { type: String, default: '💡' },
    category: { type: String, required: true },
    confidence: { type: Number, default: 1.0, min: 0, max: 1 },
    trend: { type: String, enum: ['UP', 'DOWN', 'STABLE', 'NEW'] },
    period: { type: String },
    supportingMetrics: { type: Schema.Types.Mixed },
    actionable: { type: Boolean, default: false },
    actionLabel: { type: String },
    actionRoute: { type: String },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    expiresAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

generatedInsightSchema.index({ userId: 1, category: 1, createdAt: -1 });
generatedInsightSchema.index({ userId: 1, acknowledged: 1 });

export const GeneratedInsight = model('GeneratedInsight', generatedInsightSchema);
