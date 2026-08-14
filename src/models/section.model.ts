import { Schema, model } from 'mongoose';

const sectionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', required: true },
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 40 },
    currentStrength: { type: Number, default: 0 },
    classTeacherId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

sectionSchema.index({ gradeId: 1, name: 1 }, { unique: true });

export const Section = model('Section', sectionSchema);
