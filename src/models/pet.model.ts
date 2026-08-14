import mongoose, { Schema, Document } from 'mongoose';

export interface IPet extends Document {
  childId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  petTypeId: string;
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hunger: number;
  happiness: number;
  energy: number;
  health: number;
  cleanliness: number;
  skills: string[];
  evolutionStage: number;
  totalInteractions: number;
  lastFedAt?: Date;
  lastPlayedAt?: Date;
  lastSleptAt?: Date;
  lastCleanedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PetSchema = new Schema<IPet>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  petTypeId: { type: String, required: true },
  name: { type: String, required: true, maxlength: 20 },
  level: { type: Number, default: 1, min: 1, max: 100 },
  xp: { type: Number, default: 0 },
  xpToNextLevel: { type: Number, default: 100 },
  hunger: { type: Number, default: 80, min: 0, max: 100 },
  happiness: { type: Number, default: 80, min: 0, max: 100 },
  energy: { type: Number, default: 100, min: 0, max: 100 },
  health: { type: Number, default: 100, min: 0, max: 100 },
  cleanliness: { type: Number, default: 100, min: 0, max: 100 },
  skills: [{ type: String }],
  evolutionStage: { type: Number, default: 1, min: 1, max: 5 },
  totalInteractions: { type: Number, default: 0 },
  lastFedAt: { type: Date },
  lastPlayedAt: { type: Date },
  lastSleptAt: { type: Date },
  lastCleanedAt: { type: Date },
}, { timestamps: true });

PetSchema.index({ childId: 1, petTypeId: 1 }, { unique: true });
PetSchema.index({ childId: 1 });

export const Pet = mongoose.model<IPet>('Pet', PetSchema);

export interface IPetType extends Document {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  baseStats: {
    hunger: number;
    happiness: number;
    energy: number;
    health: number;
    cleanliness: number;
  };
  evolutionStages: {
    stage: number;
    requiredLevel: number;
    name: string;
    icon: string;
    unlockedSkills: string[];
  }[];
  icon: string;
  color: string;
  sounds: string[];
  animations: string[];
  isAvailable: boolean;
  seasonalEvent?: string;
  sortOrder: number;
}

const PetTypeSchema = new Schema<IPetType>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['mammal', 'bird', 'reptile', 'aquatic', 'fantasy', 'insect'], required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary', 'mythic'], default: 'common' },
  baseStats: {
    hunger: { type: Number, default: 80 },
    happiness: { type: Number, default: 80 },
    energy: { type: Number, default: 100 },
    health: { type: Number, default: 100 },
    cleanliness: { type: Number, default: 100 },
  },
  evolutionStages: [{
    stage: { type: Number, required: true },
    requiredLevel: { type: Number, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    unlockedSkills: [{ type: String }],
  }],
  icon: { type: String, default: '' },
  color: { type: String, default: '#ffffff' },
  sounds: [{ type: String }],
  animations: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  seasonalEvent: { type: String },
  sortOrder: { type: Number, default: 0 },
});

export const PetType = mongoose.model<IPetType>('PetType', PetTypeSchema);
