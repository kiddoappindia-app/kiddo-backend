import { Schema, model } from 'mongoose';

const academicYearSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    terms: [{
      name: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    }],
  },
  { timestamps: true },
);

academicYearSchema.index({ schoolId: 1, status: 1 });

export const AcademicYear = model('AcademicYear', academicYearSchema);
