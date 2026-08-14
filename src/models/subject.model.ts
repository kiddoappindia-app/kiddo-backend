import { Schema, model } from 'mongoose';

const subjectSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#4CAF50' },
    icon: { type: String, default: '📚' },
    gradeIds: [{ type: Schema.Types.ObjectId, ref: 'Grade' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export const Subject = model('Subject', subjectSchema);
