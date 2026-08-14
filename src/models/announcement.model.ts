import { Schema, model } from 'mongoose';

const announcementSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass' },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['homework_reminder', 'exam_notice', 'school_event', 'holiday', 'general', 'urgent'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    targetAudience: [{
      type: String,
      enum: ['students', 'parents', 'teachers', 'all'],
    }],
    attachments: [{
      url: { type: String },
      name: { type: String },
      type: { type: String },
    }],
    requiresAcknowledgement: { type: Boolean, default: false },
    acknowledgements: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      acknowledgedAt: { type: Date, default: Date.now },
    }],
    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isPublished: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

announcementSchema.index({ schoolId: 1, isPublished: 1, publishAt: -1 });
announcementSchema.index({ classId: 1, isPublished: 1 });
announcementSchema.index({ teacherId: 1 });

export const Announcement = model('Announcement', announcementSchema);
