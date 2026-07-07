import { Schema, model, Types } from 'mongoose';

export interface IMilestoneDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  criteria: {
    type: 'level_reach' | 'xp_total' | 'points_total' | 'streak_days'
        | 'tasks_completed' | 'games_played' | 'logins_total';
    value: number;
  };
  rewards: {
    xp: number;
    points?: number;
    coins?: number;
  };
  isActive: boolean;
  sortOrder: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneDefinitionSchema = new Schema<IMilestoneDefinition>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'milestone' },
    criteria: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
    },
    rewards: {
      xp: { type: Number, default: 100 },
      points: { type: Number },
      coins: { type: Number },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

milestoneDefinitionSchema.index({ isActive: 1, sortOrder: 1 });

export const MilestoneDefinition = model<IMilestoneDefinition>(
  'MilestoneDefinition',
  milestoneDefinitionSchema,
);
