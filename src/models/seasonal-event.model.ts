import mongoose, { Schema, Document } from 'mongoose';

export interface ISeasonalEvent extends Document {
  key: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  banner: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  config: {
    rewardMultiplier: number;
    xpMultiplier: number;
    coinMultiplier: number;
    energyRegenBonus: number;
    exclusiveItems: string[];
    exclusivePets: string[];
    exclusiveFurniture: string[];
    exclusiveAchievements: string[];
    exclusiveMissions: string[];
    limitedEditionRewards: string[];
    dailyBonus: number;
    themeId?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  schedule: {
    timezone: string;
    dailyResetHour: number;
    specialDays: {
      date: string;
      name: string;
      bonusMultiplier: number;
      specialRewards: string[];
    }[];
  };
  requirements: {
    minLevel: number;
    requiredAchievements: string[];
    requiredStreak: number;
  };
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SeasonalEventSchema = new Schema<ISeasonalEvent>({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['summer', 'winter', 'halloween', 'christmas', 'birthday', 'school_opening', 'back_to_school', 'earth_day', 'festival', 'custom'], required: true },
  icon: { type: String, default: '' },
  banner: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  config: {
    rewardMultiplier: { type: Number, default: 1.5 },
    xpMultiplier: { type: Number, default: 1.5 },
    coinMultiplier: { type: Number, default: 1.5 },
    energyRegenBonus: { type: Number, default: 0 },
    exclusiveItems: [{ type: String }],
    exclusivePets: [{ type: String }],
    exclusiveFurniture: [{ type: String }],
    exclusiveAchievements: [{ type: String }],
    exclusiveMissions: [{ type: String }],
    limitedEditionRewards: [{ type: String }],
    dailyBonus: { type: Number, default: 0 },
    themeId: { type: String },
    colors: {
      primary: { type: String, default: '#FFD700' },
      secondary: { type: String, default: '#FF6B6B' },
      accent: { type: String, default: '#4ECDC4' },
    },
  },
  schedule: {
    timezone: { type: String, default: 'UTC' },
    dailyResetHour: { type: Number, default: 0 },
    specialDays: [{
      date: { type: String },
      name: { type: String },
      bonusMultiplier: { type: Number, default: 2 },
      specialRewards: [{ type: String }],
    }],
  },
  requirements: {
    minLevel: { type: Number, default: 0 },
    requiredAchievements: [{ type: String }],
    requiredStreak: { type: Number, default: 0 },
  },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

SeasonalEventSchema.index({ startDate: 1, endDate: 1 });
SeasonalEventSchema.index({ isActive: 1, startDate: 1 });

export const SeasonalEvent = mongoose.model<ISeasonalEvent>('SeasonalEvent', SeasonalEventSchema);

export interface IEventParticipation extends Document {
  childId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  eventKey: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  target: number;
  rewardsClaimed: string[];
  itemsUnlocked: string[];
  missionsCompleted: string[];
  dailyCheckIns: Date[];
  totalPointsEarned: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventParticipationSchema = new Schema<IEventParticipation>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'SeasonalEvent', required: true },
  eventKey: { type: String, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  progress: { type: Number, default: 0 },
  target: { type: Number, default: 100 },
  rewardsClaimed: [{ type: String }],
  itemsUnlocked: [{ type: String }],
  missionsCompleted: [{ type: String }],
  dailyCheckIns: [{ type: Date }],
  totalPointsEarned: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

EventParticipationSchema.index({ childId: 1, eventKey: 1 }, { unique: true });
EventParticipationSchema.index({ childId: 1, isActive: 1 });

export const EventParticipation = mongoose.model<IEventParticipation>('EventParticipation', EventParticipationSchema);
