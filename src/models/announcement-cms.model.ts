import { Schema, model } from 'mongoose';

export type AnnouncementTarget = 'global' | 'country' | 'state' | 'school' | 'grade' | 'class' | 'family' | 'user';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

const announcementCmsSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['info', 'update', 'alert', 'event', 'maintenance', 'promotion'], required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    target: { type: String, enum: ['global', 'country', 'state', 'school', 'grade', 'class', 'family', 'user'], required: true },
    targetIds: [Schema.Types.ObjectId],
    status: { type: String, enum: ['draft', 'scheduled', 'published', 'expired', 'archived'], default: 'draft', index: true },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    richContent: {
      html: String,
      images: [String],
      links: [{ title: String, url: String }],
      video: String,
    },
    acknowledgement: {
      required: { type: Boolean, default: false },
      buttonText: { type: String, default: 'Got it' },
      responses: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        acknowledgedAt: { type: Date },
      }],
    },
    displayConfig: {
      modal: { type: Boolean, default: false },
      dismissible: { type: Boolean, default: true },
      showOnce: { type: Boolean, default: true },
      position: { type: String, enum: ['top', 'center', 'bottom'], default: 'top' },
    },
    analytics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      dismissals: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

announcementCmsSchema.index({ target: 1, status: 1 });
announcementCmsSchema.index({ expiresAt: 1, status: 1 });

export const AnnouncementCms = model('AnnouncementCms', announcementCmsSchema);
