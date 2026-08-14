import { Schema, model } from 'mongoose';

const schoolClassSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    name: { type: String, required: true, trim: true },
    classCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxStudents: { type: Number, default: 40 },
    schedule: {
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      startTime: { type: String },
      endTime: { type: String },
    },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true },
);

schoolClassSchema.index({ schoolId: 1, gradeId: 1, sectionId: 1 });
schoolClassSchema.index({ teacherIds: 1 });

export const SchoolClass = model('SchoolClass', schoolClassSchema);
