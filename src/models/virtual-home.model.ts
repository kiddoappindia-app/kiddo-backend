import mongoose, { Schema, Document } from 'mongoose';

export interface IVirtualHome extends Document {
  childId: mongoose.Types.ObjectId;
  familyId: mongoose.Types.ObjectId;
  name: string;
  rooms: IRoom[];
  totalDecorations: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  roomId: string;
  type: string;
  name: string;
  furniture: IFurniture[];
  decorations: IDecoration[];
  theme?: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface IFurniture {
  furnitureId: string;
  name: string;
  category: string;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  color?: string;
  placedAt: Date;
}

export interface IDecoration {
  decorationId: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  placedAt: Date;
}

const FurnitureSchema = new Schema<IFurniture>({
  furnitureId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  rotation: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  color: { type: String },
  placedAt: { type: Date, default: Date.now },
}, { _id: false });

const DecorationSchema = new Schema<IDecoration>({
  decorationId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  size: {
    width: { type: Number, default: 50 },
    height: { type: Number, default: 50 },
  },
  placedAt: { type: Date, default: Date.now },
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true },
  type: { type: String, enum: ['bedroom', 'study', 'garden', 'pet_area', 'achievement_wall', 'bookshelf', 'toy_shelf', 'playroom'], required: true },
  name: { type: String, required: true },
  furniture: [FurnitureSchema],
  decorations: [DecorationSchema],
  theme: { type: String },
  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date },
}, { _id: false });

const VirtualHomeSchema = new Schema<IVirtualHome>({
  childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true },
  name: { type: String, default: 'My Home' },
  rooms: [RoomSchema],
  totalDecorations: { type: Number, default: 0 },
}, { timestamps: true });

VirtualHomeSchema.index({ childId: 1 });

export const VirtualHome = mongoose.model<IVirtualHome>('VirtualHome', VirtualHomeSchema);

export interface IFurnitureItem extends Document {
  id: string;
  name: string;
  description: string;
  category: string;
  roomType: string[];
  rarity: string;
  coinCost: number;
  unlockLevel: number;
  icon: string;
  color: string;
  size: { width: number; height: number };
  isAvailable: boolean;
  seasonalEvent?: string;
  source: string;
  sortOrder: number;
}

const FurnitureItemSchema = new Schema<IFurnitureItem>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['bed', 'desk', 'chair', 'shelf', 'lamp', 'rug', 'plant', 'wall_art', 'window', 'door', 'toy', 'book', 'tech', 'decoration'], required: true },
  roomType: [{ type: String, enum: ['bedroom', 'study', 'garden', 'pet_area', 'achievement_wall', 'bookshelf', 'toy_shelf', 'playroom'] }],
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary', 'mythic'], default: 'common' },
  coinCost: { type: Number, default: 0 },
  unlockLevel: { type: Number, default: 1 },
  icon: { type: String, default: '' },
  color: { type: String, default: '#ffffff' },
  size: {
    width: { type: Number, default: 50 },
    height: { type: Number, default: 50 },
  },
  isAvailable: { type: Boolean, default: true },
  seasonalEvent: { type: String },
  source: { type: String, default: 'shop' },
  sortOrder: { type: Number, default: 0 },
});

export const FurnitureItem = mongoose.model<IFurnitureItem>('FurnitureItem', FurnitureItemSchema);
