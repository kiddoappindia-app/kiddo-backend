import { Schema, model, Types } from 'mongoose';

export type TaskStatus = 'draft' | 'scheduled' | 'todo' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'expired' | 'skipped' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom' | 'school_days' | 'weekends' | 'holidays' | 'vacation';
export type ProofType = 'photo' | 'video' | 'voice' | 'gps' | 'timer' | 'none';

export interface ITask extends Document {
  familyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
  templateId?: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  estimatedMinutes: number;
  actualMinutes: number;
  points: number;
  basePoints: number;
  status: TaskStatus;
  proofRequired: ProofType[];
  parentApproval: boolean;
  teacherApproval: boolean;
  dueDate?: Date;
  startDate?: Date;
  expiryDate?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  proofUrl?: string;
  proofData?: Record<string, any>;
  skillTag: string;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceConfig?: {
    daysOfWeek?: number[];
    dayOfMonth?: number;
    customIntervalDays?: number;
    startDate?: Date;
    endDate?: Date;
    excludeDates?: Date[];
    maxOccurrences?: number;
    occurrenceCount: number;
  };
  autoCreate: boolean;
  autoArchive: boolean;
  autoReschedule: boolean;
  autoSkip: boolean;
  autoExpire: boolean;
  order: number;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'TaskTemplate' },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
    estimatedMinutes: { type: Number, default: 15, min: 0 },
    actualMinutes: { type: Number, default: 0, min: 0 },
    points: { type: Number, required: true, min: 0 },
    basePoints: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'todo', 'in_progress', 'completed', 'approved', 'rejected', 'expired', 'skipped', 'archived'],
      default: 'todo',
      index: true,
    },
    proofRequired: [{ type: String, enum: ['photo', 'video', 'voice', 'gps', 'timer', 'none'] }],
    parentApproval: { type: Boolean, default: false },
    teacherApproval: { type: Boolean, default: false },
    dueDate: { type: Date, index: true },
    startDate: { type: Date },
    expiryDate: { type: Date },
    completedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    proofUrl: { type: String },
    proofData: { type: Schema.Types.Mixed },
    skillTag: { type: String, trim: true, default: '', index: true },
    isRecurring: { type: Boolean, default: false },
    recurrenceType: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'custom', 'school_days', 'weekends', 'holidays', 'vacation'],
      default: 'none',
    },
    recurrenceConfig: {
      daysOfWeek: [Number],
      dayOfMonth: Number,
      customIntervalDays: Number,
      startDate: Date,
      endDate: Date,
      excludeDates: [Date],
      maxOccurrences: Number,
      occurrenceCount: { type: Number, default: 0 },
    },
    autoCreate: { type: Boolean, default: true },
    autoArchive: { type: Boolean, default: false },
    autoReschedule: { type: Boolean, default: false },
    autoSkip: { type: Boolean, default: false },
    autoExpire: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

taskSchema.index({ familyId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ familyId: 1, dueDate: 1, status: 1 });
taskSchema.index({ familyId: 1, category: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });
taskSchema.index({ isRecurring: 1, recurrenceType: 1 });

export const Task = model<ITask>('Task', taskSchema);
