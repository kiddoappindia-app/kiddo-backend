import crypto from 'node:crypto';
import { Schema, model } from 'mongoose';

const familySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true },
    familyCode: { type: String, unique: true, sparse: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['active', 'suspended', 'archived'],
      default: 'active',
    },
    settings: {
      maxChildren: { type: Number, default: 5 },
      allowChildPairing: { type: Boolean, default: true },
      pairingCodeExpiryMinutes: { type: Number, default: 60 },
    },
    qrCodeToken: { type: String },
    qrCodeExpiresAt: { type: Date },
  },
  { timestamps: true },
);

familySchema.methods.generateFamilyCode = function () {
  const code = `FAM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  this.familyCode = code;
  return code;
};

familySchema.methods.generateQrPayload = function (expiryMinutes = 15) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  this.qrCodeToken = token;
  this.qrCodeExpiresAt = expiresAt;
  return { token, expiresAt, familyId: String(this._id) };
};

familySchema.methods.isQrValid = function (token: string): boolean {
  return (
    this.qrCodeToken === token &&
    this.qrCodeExpiresAt &&
    this.qrCodeExpiresAt > new Date()
  );
};

familySchema.methods.invalidateQr = function () {
  this.qrCodeToken = undefined;
  this.qrCodeExpiresAt = undefined;
};

export const Family = model('Family', familySchema);
