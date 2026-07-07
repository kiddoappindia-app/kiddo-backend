import { Schema, model, Types } from 'mongoose';

export interface IAchievementDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: 'tasks' | 'streaks' | 'games' | 'learning' | 'social' | 'milestones' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: {
    type: 'task_count' | 'streak_count' | 'game_wins' | 'xp_total' | 'level_reach'
        | 'login_count' | 'challenge_complete' | 'mission_complete' | 'points_earned'
        | 'items_purchased' | 'conversion_count' | 'skill_xp';
    value: number;
    gameType?: 'chess' | 'memory' | 'math' | 'pattern' | 'puzzle';
    skillType?: 'intelligence' | 'strength' | 'kindness';
  };
  rewards: {
    xp: number;
    points?: number;
    coins?: number;
    badgeId?: Types.ObjectId;
  };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const achievementDefinitionSchema = new Schema<IAchievementDefinition>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'star' },
    category: {
      type: String,
      enum: ['tasks', 'streaks', 'games', 'learning', 'social', 'milestones', 'special'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    criteria: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
      gameType: { type: String, enum: ['chess', 'memory', 'math', 'pattern', 'puzzle'] },
      skillType: { type: String, enum: ['intelligence', 'strength', 'kindness'] },
    },
    rewards: {
      xp: { type: Number, default: 50 },
      points: { type: Number },
      coins: { type: Number },
      badgeId: { type: Schema.Types.ObjectId, ref: 'BadgeDefinition' },
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

achievementDefinitionSchema.index({ category: 1, sortOrder: 1 });
achievementDefinitionSchema.index({ isActive: 1 });

export const AchievementDefinition = model<IAchievementDefinition>(
  'AchievementDefinition',
  achievementDefinitionSchema,
);
