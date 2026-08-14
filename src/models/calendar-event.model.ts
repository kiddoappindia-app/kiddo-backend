import { Schema, model } from 'mongoose';

const calendarEventSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['home_task', 'school_assignment', 'exam', 'school_event', 'holiday', 'birthday', 'appointment', 'reward', 'custom'],
      required: true,
    },
    source: {
      type: String,
      enum: ['home', 'school', 'shared'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    allDay: { type: Boolean, default: false },
    color: { type: String, default: '#4CAF50' },
    recurrence: {
      type: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'] },
      daysOfWeek: [Number],
      endDate: Date,
    },
    reminders: [{
      minutesBefore: { type: Number },
      type: { type: String, enum: ['notification', 'email'] },
    }],
    linkedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    linkedAssignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment' },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass' },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

calendarEventSchema.index({ schoolId: 1, startDate: 1 });
calendarEventSchema.index({ familyId: 1, startDate: 1 });
calendarEventSchema.index({ createdBy: 1, startDate: 1 });

export const CalendarEvent = model('CalendarEvent', calendarEventSchema);
