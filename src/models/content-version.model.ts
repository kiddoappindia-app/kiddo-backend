import { Schema, model } from 'mongoose';

const contentVersionSchema = new Schema(
  {
    contentId: { type: Schema.Types.ObjectId, ref: 'ContentItem', required: true, index: true },
    contentType: { type: String, required: true },
    version: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'review', 'approved', 'published', 'archived'], default: 'draft' },
    data: { type: Schema.Types.Mixed, required: true },
    changeNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

contentVersionSchema.index({ contentId: 1, version: -1 });
contentVersionSchema.index({ status: 1 });

export const ContentVersion = model('ContentVersion', contentVersionSchema);
