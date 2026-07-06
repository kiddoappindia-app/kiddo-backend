import { Schema, model, Types } from 'mongoose';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface IPurchaseApproval {
  childId: Types.ObjectId;
  parentId: Types.ObjectId;
  itemId: Types.ObjectId;
  itemName: string;
  coinCost: number;
  status: ApprovalStatus;
  parentNote: string;
  rejectionReason: string;
  expiresAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseApprovalSchema = new Schema<IPurchaseApproval>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'RewardStoreItem', required: true },
    itemName: { type: String, required: true },
    coinCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'],
      default: 'pending',
    },
    parentNote: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

purchaseApprovalSchema.index({ childId: 1, status: 1 });
purchaseApprovalSchema.index({ parentId: 1, status: 1 });
purchaseApprovalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PurchaseApproval = model<IPurchaseApproval>('PurchaseApproval', purchaseApprovalSchema);
