import { Schema, model, Types } from 'mongoose';

export interface IMissionDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'monthly' | 'campaign';
  prerequisites: Array<{
    type: 'achievement' | 'badge' | 'level' | 'mission';
    id: string;
  }>;
  objectives: Array<{
    description: string;
    criteriaType: string;
    value: number;
  }>;
  rewards: {
    xp: number;
    points?: number;
    coins?: number;
    badgeId?: Types.ObjectId;
  };
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const missionDefinitionSchema = new Schema<IMissionDefinition>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'mission' },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'campaign'],
      required: true,
    },
    prerequisites: [{
      type: { type: String, enum: ['achievement', 'badge', 'level', 'mission'] },
      id: { type: String },
    }],
    objectives: [{
      description: { type: String },
      criteriaType: { type: String },
      value: { type: Number },
    }],
    rewards: {
      xp: { type: Number, default: 200 },
      points: { type: Number },
      coins: { type: Number },
      badgeId: { type: Schema.Types.ObjectId, ref: 'BadgeDefinition' },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

missionDefinitionSchema.index({ type: 1, isActive: 1 });

export const MissionDefinition = model<IMissionDefinition>(
  'MissionDefinition',
  missionDefinitionSchema,
);
