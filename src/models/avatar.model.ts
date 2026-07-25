import { Schema, model } from 'mongoose';

const equippedItemsSchema = new Schema(
  {
    hair: { type: String, default: '' },
    eyes: { type: String, default: '' },
    eyebrows: { type: String, default: '' },
    mouth: { type: String, default: '' },
    skin: { type: String, default: '' },
    top: { type: String, default: '' },
    bottom: { type: String, default: '' },
    shoes: { type: String, default: '' },
    hat: { type: String, default: '' },
    glasses: { type: String, default: '' },
    necklace: { type: String, default: '' },
    watch: { type: String, default: '' },
    back: { type: String, default: '' },
    pet: { type: String, default: '' },
    hand: { type: String, default: '' },
    effect: { type: String, default: '' },
    pose: { type: String, default: '' },
  },
  { _id: false },
);

const avatarSchema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    baseAvatar: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    equippedItems: { type: equippedItemsSchema, default: () => ({}) },
    inventory: [{ type: String }],
    coinsSpent: { type: Number, default: 0 },
    animationsUnlocked: [{ type: String }],
    pets: [{ type: String }],
    currentPose: { type: String, default: 'idle' },
    lastDailyReward: { type: Date },
  },
  { timestamps: true },
);

export const Avatar = model('Avatar', avatarSchema);
