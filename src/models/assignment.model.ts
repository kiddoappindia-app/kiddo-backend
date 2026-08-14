import { Schema, model, Types } from 'mongoose';

export type AssignmentStatus = 'draft' | 'published' | 'active' | 'submitted' | 'graded' | 'returned' | 'resubmitted' | 'archived';
export type SubmissionType = 'photo' | 'pdf' | 'voice' | 'link' | 'text' | 'file';

const assignmentSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    instructions: { type: String, trim: true, default: '' },
    attachments: [{
      url: { type: String },
      name: { type: String },
      type: { type: String },
      size: { type: Number },
    }],
    dueDate: { type: Date, required: true },
    estimatedMinutes: { type: Number, default: 30 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    points: { type: Number, default: 10 },
    submissionTypes: [{
      type: String,
      enum: ['photo', 'pdf', 'voice', 'link', 'text', 'file'],
    }],
    allowLateSubmission: { type: Boolean, default: true },
    latePenaltyPercent: { type: Number, default: 10, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 3 },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    assignedToAll: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'active', 'submitted', 'graded', 'returned', 'resubmitted', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date },
    submissions: [{
      studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      submittedAt: { type: Date, default: Date.now },
      content: { type: String },
      attachments: [{
        url: { type: String },
        name: { type: String },
        type: { type: String },
      }],
      grade: { type: Number, min: 0 },
      feedback: { type: String },
      gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      gradedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'submitted', 'graded', 'returned'],
        default: 'pending',
      },
      attemptNumber: { type: Number, default: 1 },
    }],
    rubric: [{
      criterion: { type: String },
      maxPoints: { type: Number },
      description: { type: String },
    }],
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

assignmentSchema.index({ classId: 1, status: 1, dueDate: 1 });
assignmentSchema.index({ teacherId: 1, status: 1 });
assignmentSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

export const Assignment = model('Assignment', assignmentSchema);
