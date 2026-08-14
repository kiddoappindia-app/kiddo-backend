import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User' },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
    content: { type: String, required: true, trim: true },
    attachments: [{
      url: { type: String },
      name: { type: String },
      type: { type: String },
    }],
    type: {
      type: String,
      enum: ['text', 'homework_discussion', 'meeting_request', 'progress_update', 'general'],
      default: 'text',
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isArchived: { type: Boolean, default: false },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    threadId: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true },
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ studentId: 1, createdAt: -1 });

export const Message = model('Message', messageSchema);
