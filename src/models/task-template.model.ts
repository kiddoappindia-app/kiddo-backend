import { Schema, model, Types } from 'mongoose';

export interface ITaskTemplate extends Document {
  familyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  priority: string;
  difficulty: string;
  estimatedMinutes: number;
  basePoints: number;
  proofRequired: string[];
  parentApproval: boolean;
  teacherApproval: boolean;
  isRecurring: boolean;
  recurrenceType: string;
  recurrenceConfig?: Record<string, any>;
  skillTag: string;
  tags: string[];
  usageCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskTemplateSchema = new Schema<ITaskTemplate>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'General' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
    estimatedMinutes: { type: Number, default: 15, min: 0 },
    basePoints: { type: Number, required: true, min: 0 },
    proofRequired: [{ type: String, enum: ['photo', 'video', 'voice', 'gps', 'timer', 'none'] }],
    parentApproval: { type: Boolean, default: false },
    teacherApproval: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurrenceType: { type: String, default: 'none' },
    recurrenceConfig: { type: Schema.Types.Mixed },
    skillTag: { type: String, trim: true, default: '' },
    tags: [{ type: String }],
    usageCount: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

taskTemplateSchema.index({ familyId: 1, createdBy: 1 });

export const TaskTemplate = model<ITaskTemplate>('TaskTemplate', taskTemplateSchema);
