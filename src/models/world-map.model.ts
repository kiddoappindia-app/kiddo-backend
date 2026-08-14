import mongoose, { Schema, Document } from 'mongoose';

export interface IWorldArea extends Document {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  color: string;
  background: string;
  position: { x: number; y: number };
  unlockRequirements: {
    type: string;
    value: number;
    description: string;
  }[];
  isUnlockedByDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  miniGames: string[];
  npcs: {
    id: string;
    name: string;
    role: string;
    dialogue: string[];
    icon: string;
  }[];
  collectibles: {
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    icon: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const WorldAreaSchema = new Schema<IWorldArea>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['home', 'school', 'park', 'library', 'space', 'ocean', 'jungle', 'castle', 'science_lab', 'art_studio'], required: true },
  icon: { type: String, default: '' },
  color: { type: String, default: '#4ECDC4' },
  background: { type: String, default: '' },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  unlockRequirements: [{
    type: { type: String, enum: ['level', 'achievement', 'streak', 'tasks_completed', 'xp_total', 'event'] },
    value: { type: Number, default: 0 },
    description: { type: String, default: '' },
  }],
  isUnlockedByDefault: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  miniGames: [{ type: String }],
  npcs: [{
    id: { type: String },
    name: { type: String },
    role: { type: String },
    dialogue: [{ type: String }],
    icon: { type: String },
  }],
  collectibles: [{
    id: { type: String },
    name: { type: String },
    type: { type: String },
    position: {
      x: { type: Number },
      y: { type: Number },
    },
    icon: { type: String },
  }],
}, { timestamps: true });

WorldAreaSchema.index({ sortOrder: 1 });

export const WorldArea = mongoose.model<IWorldArea>('WorldArea', WorldAreaSchema);

export interface IWorldProgress extends Document {
  childId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  unlockedAreas: string[];
  currentArea: string;
  visitedAreas: string[];
  collectiblesFound: string[];
  npcsInteracted: string[];
  totalExploreTime: number;
  achievementsUnlocked: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WorldProgressSchema = new Schema<IWorldProgress>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  unlockedAreas: [{ type: String, default: ['home'] }],
  currentArea: { type: String, default: 'home' },
  visitedAreas: [{ type: String }],
  collectiblesFound: [{ type: String }],
  npcsInteracted: [{ type: String }],
  totalExploreTime: { type: Number, default: 0 },
  achievementsUnlocked: [{ type: String }],
}, { timestamps: true });

WorldProgressSchema.index({ childId: 1 });

export const WorldProgress = mongoose.model<IWorldProgress>('WorldProgress', WorldProgressSchema);
