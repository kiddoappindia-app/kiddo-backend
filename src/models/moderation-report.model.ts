import { Schema, model } from 'mongoose';

export type ReportType = 'user' | 'content' | 'message' | 'behavior';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

const moderationReportSchema = new Schema(
  {
    type: { type: String, enum: ['user', 'content', 'message', 'behavior'], required: true, index: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    status: { type: String, enum: ['pending', 'reviewing', 'resolved', 'escalated', 'dismissed'], default: 'pending', index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['user', 'message', 'content', 'assignment', 'announcement'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    description: { type: String },
    evidence: [{ type: String }],
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    resolution: { type: String },
    action: { type: String, enum: ['none', 'warning', 'content_removal', 'user_suspend', 'user_ban', 'escalate'], default: 'none' },
    escalation: {
      escalatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
      escalatedAt: Date,
      reason: String,
      level: Number,
    },
    audit: [{
      action: String,
      performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      performedAt: { type: Date, default: Date.now },
      details: Schema.Types.Mixed,
    }],
    childSafety: {
      isChildSafety: { type: Boolean, default: false },
      age: Number,
      automaticFlags: [String],
    },
  },
  { timestamps: true },
);

moderationReportSchema.index({ reporterId: 1, createdAt: -1 });
moderationReportSchema.index({ targetType: 1, targetId: 1 });

export const ModerationReport = model('ModerationReport', moderationReportSchema);
