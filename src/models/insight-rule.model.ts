import { Schema, model, Types } from 'mongoose';

const insightRuleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['habit', 'growth', 'attendance', 'homework', 'reading', 'reward', 'streak', 'custom'],
      required: true,
    },
    conditions: [{
      metric: { type: String, required: true },
      operator: { type: String, enum: ['gt', 'lt', 'gte', 'lte', 'eq', 'ne', 'change_gt', 'change_lt'], required: true },
      value: { type: Number, required: true },
      period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'], default: 'weekly' },
    }],
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    insight: {
      type: { type: String, required: true },
      title: { type: String, required: true },
      message: { type: String, required: true },
      severity: { type: String, enum: ['info', 'success', 'warning', 'attention'], default: 'info' },
      icon: { type: String, default: '💡' },
      actionLabel: { type: String },
      actionRoute: { type: String },
    },
    targetRoles: [{ type: String, enum: ['parent', 'teacher', 'child'] }],
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    cooldownDays: { type: Number, default: 7 },
    lastTriggeredAt: { type: Date },
    triggerCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

insightRuleSchema.index({ category: 1, isActive: 1 });
insightRuleSchema.index({ isActive: 1, priority: -1 });

export const InsightRule = model('InsightRule', insightRuleSchema);
