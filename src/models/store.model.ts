import { Schema, model, Types } from 'mongoose';

export type StoreItemType = 'physical' | 'digital' | 'privilege' | 'coupon' | 'experience' | 'custom';
export type StoreItemStatus = 'active' | 'inactive' | 'sold_out' | 'archived';

export interface IStoreItem extends Document {
  familyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  title: string;
  description: string;
  type: StoreItemType;
  icon: string;
  image?: string;
  coinsCost: number;
  xpReward: number;
  stock: number;
  maxPerChild: number;
  totalRedeemed: number;
  status: StoreItemStatus;
  validFrom?: Date;
  validUntil?: Date;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const storeItemSchema = new Schema<IStoreItem>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['physical', 'digital', 'privilege', 'coupon', 'experience', 'custom'],
      required: true,
      index: true,
    },
    icon: { type: String, default: '🎁' },
    image: { type: String },
    coinsCost: { type: Number, required: true, min: 0 },
    xpReward: { type: Number, default: 0 },
    stock: { type: Number, default: -1 },
    maxPerChild: { type: Number, default: -1 },
    totalRedeemed: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'sold_out', 'archived'], default: 'active' },
    validFrom: { type: Date },
    validUntil: { type: Date },
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

storeItemSchema.index({ familyId: 1, status: 1 });
storeItemSchema.index({ familyId: 1, type: 1 });

export const StoreItem = model<IStoreItem>('StoreItem', storeItemSchema);

export interface IStoreRedemption extends Document {
  storeItemId: Types.ObjectId;
  childId: Types.ObjectId;
  familyId: Types.ObjectId;
  coinsCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  fulfilledAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const storeRedemptionSchema = new Schema<IStoreRedemption>(
  {
    storeItemId: { type: Schema.Types.ObjectId, ref: 'StoreItem', required: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    coinsCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
      default: 'pending',
      index: true,
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    fulfilledAt: { type: Date },
    rejectionReason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

storeRedemptionSchema.index({ childId: 1, status: 1 });
storeRedemptionSchema.index({ familyId: 1, status: 1 });

export const StoreRedemption = model<IStoreRedemption>('StoreRedemption', storeRedemptionSchema);
