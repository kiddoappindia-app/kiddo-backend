import { Schema, model, Types } from 'mongoose';

export type LeaderboardScope = 'family' | 'school' | 'class' | 'global';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'lifetime';
export type LeaderboardMetric = 'xp' | 'coins' | 'tasks_completed' | 'streak_days' | 'level';

export interface ILeaderboardEntry extends Document {
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  scope: LeaderboardScope;
  scopeId?: string;
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  value: number;
  rank: number;
  previousRank?: number;
  periodStart: Date;
  periodEnd: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const leaderboardEntrySchema = new Schema<ILeaderboardEntry>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    scope: { type: String, enum: ['family', 'school', 'class', 'global'], required: true },
    scopeId: { type: String },
    period: { type: String, enum: ['daily', 'weekly', 'monthly', 'seasonal', 'lifetime'], required: true },
    metric: { type: String, enum: ['xp', 'coins', 'tasks_completed', 'streak_days', 'level'], required: true },
    value: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    previousRank: { type: Number },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

leaderboardEntrySchema.index({ scope: 1, scopeId: 1, period: 1, metric: 1, value: -1 });
leaderboardEntrySchema.index({ childId: 1, scope: 1, period: 1, metric: 1 });
leaderboardEntrySchema.index({ familyId: 1, period: 1, metric: 1, value: -1 });

export const LeaderboardEntry = model<ILeaderboardEntry>('LeaderboardEntry', leaderboardEntrySchema);
