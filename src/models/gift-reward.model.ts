import { Schema, model, Types } from 'mongoose';

export interface IGiftReward {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  type: 'reward_points' | 'redeem_coins' | 'store_item';
  amount: number;
  itemId: Types.ObjectId | null;
  message: string;
  status: 'sent' | 'received' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const giftRewardSchema = new Schema<IGiftReward>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['reward_points', 'redeem_coins', 'store_item'],
      required: true,
    },
    amount: { type: Number, default: 0 },
    itemId: { type: Schema.Types.ObjectId, ref: 'RewardStoreItem', default: null },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['sent', 'received', 'declined'],
      default: 'sent',
    },
  },
  { timestamps: true },
);

export const GiftReward = model<IGiftReward>('GiftReward', giftRewardSchema);
