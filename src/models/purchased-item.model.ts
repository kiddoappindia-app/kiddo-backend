import { Schema, model, Types } from 'mongoose';

export type PurchasedItemSource = 'purchased' | 'gifted' | 'admin';

export interface IPurchasedItem {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  itemName: string;
  itemCategory: Types.ObjectId;
  coinCost: number;
  rarity: string;
  purchasedAt: Date;
  isEquipped: boolean;
  source: PurchasedItemSource;
  giftFrom: Types.ObjectId | null;
  expiresAt: Date | null;
  transactionRef: Types.ObjectId;
  createdAt: Date;
}

const purchasedItemSchema = new Schema<IPurchasedItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'RewardStoreItem', required: true },
    itemName: { type: String, required: true },
    itemCategory: { type: Schema.Types.ObjectId, ref: 'RewardCategory', required: true },
    coinCost: { type: Number, required: true },
    rarity: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
    isEquipped: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['purchased', 'gifted', 'admin'],
      default: 'purchased',
    },
    giftFrom: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expiresAt: { type: Date, default: null },
    transactionRef: { type: Schema.Types.ObjectId, ref: 'RewardTransaction', required: true },
  },
  { timestamps: true },
);

purchasedItemSchema.index({ userId: 1, itemId: 1 }, { unique: true });
purchasedItemSchema.index({ userId: 1, isEquipped: 1 });
purchasedItemSchema.index({ userId: 1, source: 1 });
purchasedItemSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PurchasedItem = model<IPurchasedItem>('PurchasedItem', purchasedItemSchema);
