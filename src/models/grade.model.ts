import { Schema, model } from 'mongoose';

const gradeSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    name: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1, max: 12 },
    description: { type: String, default: '' },
    sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
  },
  { timestamps: true },
);

gradeSchema.index({ schoolId: 1, level: 1 }, { unique: true });

export const Grade = model('Grade', gradeSchema);
