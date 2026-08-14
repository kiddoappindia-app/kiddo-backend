import { Schema, model } from 'mongoose';

const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      country: { type: String, default: 'IN' },
    },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    logo: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    academicYearStartMonth: { type: Number, default: 4, min: 1, max: 12 },
    status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active' },
    maxStudents: { type: Number, default: 10000 },
    maxTeachers: { type: Number, default: 500 },
    features: {
      attendance: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
      messaging: { type: Boolean, default: true },
      reports: { type: Boolean, default: true },
    },
    settings: {
      allowParentMessaging: { type: Boolean, default: true },
      requireAssignmentApproval: { type: Boolean, default: false },
      attendanceGracePeriodMinutes: { type: Number, default: 15 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const School = model('School', schoolSchema);
