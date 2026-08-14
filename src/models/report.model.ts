import { Schema, model, Types } from 'mongoose';

const reportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['parent_weekly', 'teacher_weekly', 'child_celebration', 'parent_monthly', 'teacher_monthly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    generatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'generated', 'sent', 'viewed'], default: 'pending' },
    summary: {
      tasksCompleted: { type: Number, default: 0 },
      tasksTotal: { type: Number, default: 0 },
      homeworkCompleted: { type: Number, default: 0 },
      homeworkTotal: { type: Number, default: 0 },
      attendanceRate: { type: Number, default: 0 },
      readingMinutes: { type: Number, default: 0 },
      coinsEarned: { type: Number, default: 0 },
      xpEarned: { type: Number, default: 0 },
      achievementsUnlocked: { type: Number, default: 0 },
      streakDays: { type: Number, default: 0 },
      growthScore: { type: Number, default: 0 },
      growthChange: { type: Number, default: 0 },
    },
    growthDimensions: { type: Schema.Types.Mixed },
    highlights: [{
      type: { type: String },
      title: { type: String },
      description: { type: String },
      icon: { type: String },
    }],
    insights: [{ type: Schema.Types.ObjectId, ref: 'GeneratedInsight' }],
    missedOpportunities: [{
      type: { type: String },
      description: { type: String },
      impact: { type: String },
    }],
    recommendations: [{
      title: { type: String },
      description: { type: String },
      priority: { type: String },
    }],
    sentAt: { type: Date },
    viewedAt: { type: Date },
    exportedFormat: { type: String, enum: ['pdf', 'email', 'share'] },
  },
  { timestamps: true },
);

reportSchema.index({ userId: 1, type: 1, periodStart: -1 });
reportSchema.index({ userId: 1, status: 1 });

export const Report = model('Report', reportSchema);
