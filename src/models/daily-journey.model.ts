import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyJourney extends Document {
  childId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  date: Date;
  dailyGift: {
    claimed: boolean;
    claimedAt?: Date;
    giftType: string;
    reward: {
      coins: number;
      xp: number;
      stars: number;
    };
  };
  dailyMissions: {
    missionId: string;
    title: string;
    description: string;
    type: string;
    target: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
    reward: {
      coins: number;
      xp: number;
      stars: number;
    };
  }[];
  dailyQuote: {
    text: string;
    author: string;
    shown: boolean;
  };
  dailyChallenge: {
    id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
    reward: {
      coins: number;
      xp: number;
      stars: number;
    };
  };
  surprises: {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    shown: boolean;
    claimed: boolean;
  }[];
  miniCelebrations: {
    type: string;
    message: string;
    timestamp: Date;
    shown: boolean;
  }[];
  totalXpEarned: number;
  totalCoinsEarned: number;
  loginStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyMissionSchema = new Schema({
  missionId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['task_complete', 'game_play', 'read', 'exercise', 'custom'], required: true },
  target: { type: Number, default: 1 },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  reward: {
    coins: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
  },
}, { _id: false });

const DailyChallengeSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['streak', 'completion', 'speed', 'perfect', 'social'], required: true },
  target: { type: Number, default: 1 },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  reward: {
    coins: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
  },
}, { _id: false });

const SurpriseSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['bonus_coins', 'bonus_xp', 'item_unlock', 'pet_visit', 'mascot_dance', 'treasure'], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  shown: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
}, { _id: false });

const DailyJourneySchema = new Schema<IDailyJourney>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  date: { type: Date, required: true },
  dailyGift: {
    claimed: { type: Boolean, default: false },
    claimedAt: { type: Date },
    giftType: { type: String, default: 'standard' },
    reward: {
      coins: { type: Number, default: 5 },
      xp: { type: Number, default: 10 },
      stars: { type: Number, default: 1 },
    },
  },
  dailyMissions: [DailyMissionSchema],
  dailyQuote: {
    text: { type: String, default: '' },
    author: { type: String, default: '' },
    shown: { type: Boolean, default: false },
  },
  dailyChallenge: DailyChallengeSchema,
  surprises: [SurpriseSchema],
  miniCelebrations: [{
    type: { type: String },
    message: { type: String },
    timestamp: { type: Date },
    shown: { type: Boolean, default: false },
  }],
  totalXpEarned: { type: Number, default: 0 },
  totalCoinsEarned: { type: Number, default: 0 },
  loginStreak: { type: Number, default: 1 },
}, { timestamps: true });

DailyJourneySchema.index({ childId: 1, date: 1 }, { unique: true });
DailyJourneySchema.index({ childId: 1, date: -1 });

export const DailyJourney = mongoose.model<IDailyJourney>('DailyJourney', DailyJourneySchema);

export interface IDailyJourneyConfig extends Document {
  enabled: boolean;
  dailyGiftBase: { coins: number; xp: number; stars: number };
  dailyMissionsCount: number;
  surprisesEnabled: boolean;
  celebrationsEnabled: boolean;
  quotesEnabled: boolean;
  challengeDifficulty: string;
  parentCanDisable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyJourneyConfigSchema = new Schema<IDailyJourneyConfig>({
  enabled: { type: Boolean, default: true },
  dailyGiftBase: {
    coins: { type: Number, default: 5 },
    xp: { type: Number, default: 10 },
    stars: { type: Number, default: 1 },
  },
  dailyMissionsCount: { type: Number, default: 3 },
  surprisesEnabled: { type: Boolean, default: true },
  celebrationsEnabled: { type: Boolean, default: true },
  quotesEnabled: { type: Boolean, default: true },
  challengeDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  parentCanDisable: { type: Boolean, default: true },
}, { timestamps: true });

export const DailyJourneyConfig = mongoose.model<IDailyJourneyConfig>('DailyJourneyConfig', DailyJourneyConfigSchema);
