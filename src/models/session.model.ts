import { Schema, model } from 'mongoose';

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    refreshTokenHash: { type: String, required: true },
    deviceId: { type: String },
    platform: { type: String, enum: ['android', 'ios', 'web'] },
    ip: { type: String },
    userAgent: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true },
    lastActiveAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
    revokeReason: { type: String },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = model('Session', sessionSchema);
