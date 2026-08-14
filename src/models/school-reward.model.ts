import { Schema, model } from 'mongoose';

const schoolRewardSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass' },
    type: {
      type: String,
      enum: ['stars', 'certificate', 'badge', 'recognition', 'participation'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    stars: { type: Number, default: 0 },
    metadata: {
      subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
      assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
      category: { type: String },
    },
    awardedAt: { type: Date, default: Date.now },
    parentConverted: { type: Boolean, default: false },
    convertedAt: { type: Date },
    conversionType: {
      type: String,
      enum: ['coins', 'xp', 'achievement', 'none'],
      default: 'none',
    },
    parentApprovalRequired: { type: Boolean, default: true },
    parentApproved: { type: Boolean, default: false },
    parentApprovedAt: { type: Date },
  },
  { timestamps: true },
);

schoolRewardSchema.index({ studentId: 1, awardedAt: -1 });
schoolRewardSchema.index({ teacherId: 1, awardedAt: -1 });

export const SchoolReward = model('SchoolReward', schoolRewardSchema);
