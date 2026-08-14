import { Schema, model } from 'mongoose';

const attendanceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass', required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, index: true },
    records: [{
      studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      status: {
        type: String,
        enum: ['present', 'late', 'absent', 'excused'],
        required: true,
      },
      minutesLate: { type: Number, default: 0 },
      note: { type: String, default: '' },
      markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      markedAt: { type: Date, default: Date.now },
    }],
    totalPresent: { type: Number, default: 0 },
    totalLate: { type: Number, default: 0 },
    totalAbsent: { type: Number, default: 0 },
    totalExcused: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
    finalizedAt: { type: Date },
  },
  { timestamps: true },
);

attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ teacherId: 1, date: 1 });

export const Attendance = model('Attendance', attendanceSchema);
