import { Schema, model } from 'mongoose';

export type EventCategory =
  | 'weekend' | 'holiday' | 'summer' | 'back_to_school'
  | 'reading_month' | 'earth_day' | 'science_week' | 'math_week'
  | 'custom';

const eventConfigSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: ['weekend', 'holiday', 'summer', 'back_to_school', 'reading_month', 'earth_day', 'science_week', 'math_week', 'custom'], required: true },
    status: { type: String, enum: ['draft', 'scheduled', 'active', 'ended', 'archived'], default: 'draft', index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    eligibility: {
      schools: [{ type: Schema.Types.ObjectId, ref: 'School' }],
      grades: [String],
      classes: [{ type: Schema.Types.ObjectId, ref: 'SchoolClass' }],
      roles: [String],
      minLevel: { type: Number },
    },
    tasks: [
      {
        title: String,
        description: String,
        type: String,
        points: Number,
        xp: Number,
        coins: Number,
        difficulty: String,
        category: String,
        required: { type: Boolean, default: false },
      },
    ],
    rewards: {
      participation: { points: Number, xp: Number, coins: Number },
      completion: { points: Number, xp: Number, coins: Number },
      topPerformers: [{ position: Number, badge: String, points: Number, xp: Number }],
      badge: { type: Schema.Types.ObjectId, ref: 'AchievementDefinition' },
    },
    theme: {
      primaryColor: String,
      secondaryColor: String,
      icon: String,
      banner: String,
      animation: String,
    },
    assets: [String],
    config: {
      showLeaderboard: { type: Boolean, default: true },
      allowLateParticipation: { type: Boolean, default: false },
      maxParticipants: Number,
      notifyOnStart: { type: Boolean, default: true },
      notifyOnEnd: { type: Boolean, default: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

eventConfigSchema.index({ startDate: 1, endDate: 1 });
eventConfigSchema.index({ category: 1, status: 1 });

export const EventConfig = model('EventConfig', eventConfigSchema);
