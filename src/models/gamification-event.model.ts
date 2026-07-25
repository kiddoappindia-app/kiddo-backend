import { Schema, model, Types } from 'mongoose';

export interface IGamificationEvent {
  key: string;
  title: string;
  description: string;
  banner?: string;
  type: 'xp_boost' | 'points_boost' | 'coins_boost' | 'challenge_boost' | 'special';
  startDate: Date;
  endDate: Date;
  multiplier: number;
  targetCriteria?: {
    actionTypes?: string[];
    gameTypes?: string[];
    roles?: string[];
  };
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gamificationEventSchema = new Schema<IGamificationEvent>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    banner: { type: String },
    type: {
      type: String,
      enum: ['xp_boost', 'points_boost', 'coins_boost', 'challenge_boost', 'special'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    multiplier: { type: Number, default: 2.0 },
    targetCriteria: {
      actionTypes: [{ type: String }],
      gameTypes: [{ type: String }],
      roles: [{ type: String }],
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

gamificationEventSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export const GamificationEvent = model<IGamificationEvent>(
  'GamificationEvent',
  gamificationEventSchema,
);
