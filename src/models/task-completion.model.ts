import { Schema, model, Types } from 'mongoose';

export interface ITaskCompletion extends Document {
  taskId: Types.ObjectId;
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  status: 'submitted' | 'approved' | 'rejected';
  proofUrl?: string;
  proofData?: Record<string, any>;
  completedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  timeSpentMinutes: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonuses: {
    speed: number;
    morning: number;
    streak: number;
    perfect: number;
    weekend: number;
    holiday: number;
    teacher: number;
    parent: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const taskCompletionSchema = new Schema<ITaskCompletion>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'rejected'],
      default: 'submitted',
      index: true,
    },
    proofUrl: { type: String },
    proofData: { type: Schema.Types.Mixed },
    completedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
    basePoints: { type: Number, required: true, min: 0 },
    bonusPoints: { type: Number, default: 0, min: 0 },
    totalPoints: { type: Number, required: true, min: 0 },
    bonuses: {
      speed: { type: Number, default: 0 },
      morning: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      perfect: { type: Number, default: 0 },
      weekend: { type: Number, default: 0 },
      holiday: { type: Number, default: 0 },
      teacher: { type: Number, default: 0 },
      parent: { type: Number, default: 0 },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

taskCompletionSchema.index({ taskId: 1, childId: 1 });
taskCompletionSchema.index({ childId: 1, completedAt: -1 });
taskCompletionSchema.index({ familyId: 1, completedAt: -1 });

export const TaskCompletion = model<ITaskCompletion>('TaskCompletion', taskCompletionSchema);
