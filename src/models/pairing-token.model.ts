import crypto from 'node:crypto';
import { Schema, model, type Document, type Model } from 'mongoose';

export interface IPairingToken {
  familyId: import('mongoose').Types.ObjectId;
  createdBy: import('mongoose').Types.ObjectId;
  token: string;
  code?: string;
  type: 'qr' | 'code';
  status: 'active' | 'used' | 'expired' | 'revoked';
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: import('mongoose').Types.ObjectId;
  maxUses: number;
  useCount: number;
  metadata: Record<string, unknown>;
}

export interface PairingTokenDocument extends IPairingToken, Document {
  isExpired(): boolean;
  canUse(): boolean;
  markUsed(userId: string): Promise<void>;
}

export interface PairingTokenModel extends Model<PairingTokenDocument> {
  generateCode(): string;
  generateToken(): string;
}

const pairingTokenSchema = new Schema<PairingTokenDocument, PairingTokenModel>(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    code: { type: String, unique: true, sparse: true },
    type: {
      type: String,
      enum: ['qr', 'code'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'used', 'expired', 'revoked'],
      default: 'active',
    },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    maxUses: { type: Number, default: 1 },
    useCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

pairingTokenSchema.index({ familyId: 1, status: 1 });
pairingTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

pairingTokenSchema.statics.generateCode = function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

pairingTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

pairingTokenSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

pairingTokenSchema.methods.canUse = function () {
  return this.status === 'active' && !this.isExpired() && this.useCount < this.maxUses;
};

pairingTokenSchema.methods.markUsed = async function (userId: string) {
  this.status = 'used';
  this.usedAt = new Date();
  this.usedBy = userId;
  this.useCount += 1;
  await this.save();
};

export const PairingToken = model<PairingTokenDocument, PairingTokenModel>('PairingToken', pairingTokenSchema);
