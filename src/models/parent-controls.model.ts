import mongoose, { Schema, Document } from 'mongoose';

export interface IParentControls extends Document {
  childId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  allowedGames: string[];
  dailyPlayTimeMinutes: number;
  playTimeUsedMinutes: number;
  playTimeResetAt: Date;
  rewardMultipliers: {
    taskMultiplier: number;
    gameMultiplier: number;
    streakMultiplier: number;
    eventMultiplier: number;
  };
  storeVisibility: {
    showAvatarShop: boolean;
    showRewardStore: boolean;
    showMarketplace: boolean;
    showSeasonalItems: boolean;
  };
  featureToggles: {
    petSystemEnabled: boolean;
    seasonalEventsEnabled: boolean;
    animationsEnabled: boolean;
    miniGamesEnabled: boolean;
    worldMapEnabled: boolean;
    virtualHomeEnabled: boolean;
    socialFeaturesEnabled: boolean;
    dailyJourneyEnabled: boolean;
  };
  accessibility: {
    dyslexiaFontEnabled: boolean;
    reducedMotion: boolean;
    colorBlindMode: string;
    voiceGuidance: boolean;
    largeText: boolean;
    simpleMode: boolean;
    highContrast: boolean;
  };
  contentFilters: {
    blockedItems: string[];
    blockedPets: string[];
    blockedAreas: string[];
    blockedGames: string[];
    maxPetCount: number;
    maxInventorySize: number;
  };
  notifications: {
    dailyReminder: boolean;
    achievementAlerts: boolean;
    storeAlerts: boolean;
    eventAlerts: boolean;
    petAlerts: boolean;
  };
  schedule: {
    quietHoursStart: number;
    quietHoursEnd: number;
    weekendPlayLimit: number;
    weekdayPlayLimit: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ParentControlsSchema = new Schema<IParentControls>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  allowedGames: [{ type: String, default: ['chess', 'math', 'memory', 'pattern'] }],
  dailyPlayTimeMinutes: { type: Number, default: 60 },
  playTimeUsedMinutes: { type: Number, default: 0 },
  playTimeResetAt: { type: Date, default: Date.now },
  rewardMultipliers: {
    taskMultiplier: { type: Number, default: 1.0 },
    gameMultiplier: { type: Number, default: 1.0 },
    streakMultiplier: { type: Number, default: 1.0 },
    eventMultiplier: { type: Number, default: 1.0 },
  },
  storeVisibility: {
    showAvatarShop: { type: Boolean, default: true },
    showRewardStore: { type: Boolean, default: true },
    showMarketplace: { type: Boolean, default: true },
    showSeasonalItems: { type: Boolean, default: true },
  },
  featureToggles: {
    petSystemEnabled: { type: Boolean, default: true },
    seasonalEventsEnabled: { type: Boolean, default: true },
    animationsEnabled: { type: Boolean, default: true },
    miniGamesEnabled: { type: Boolean, default: true },
    worldMapEnabled: { type: Boolean, default: true },
    virtualHomeEnabled: { type: Boolean, default: true },
    socialFeaturesEnabled: { type: Boolean, default: true },
    dailyJourneyEnabled: { type: Boolean, default: true },
  },
  accessibility: {
    dyslexiaFontEnabled: { type: Boolean, default: false },
    reducedMotion: { type: Boolean, default: false },
    colorBlindMode: { type: String, enum: ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'], default: 'none' },
    voiceGuidance: { type: Boolean, default: false },
    largeText: { type: Boolean, default: false },
    simpleMode: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
  },
  contentFilters: {
    blockedItems: [{ type: String }],
    blockedPets: [{ type: String }],
    blockedAreas: [{ type: String }],
    blockedGames: [{ type: String }],
    maxPetCount: { type: Number, default: 5 },
    maxInventorySize: { type: Number, default: 1000 },
  },
  notifications: {
    dailyReminder: { type: Boolean, default: true },
    achievementAlerts: { type: Boolean, default: true },
    storeAlerts: { type: Boolean, default: true },
    eventAlerts: { type: Boolean, default: true },
    petAlerts: { type: Boolean, default: true },
  },
  schedule: {
    quietHoursStart: { type: Number, default: 21 },
    quietHoursEnd: { type: Number, default: 7 },
    weekendPlayLimit: { type: Number, default: 120 },
    weekdayPlayLimit: { type: Number, default: 60 },
  },
}, { timestamps: true });

ParentControlsSchema.index({ childId: 1 });

export const ParentControls = mongoose.model<IParentControls>('ParentControls', ParentControlsSchema);
