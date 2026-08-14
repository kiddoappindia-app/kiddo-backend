import { Schema, model } from 'mongoose';

const deviceSchema = new Schema(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    deviceId: { type: String, required: true, unique: true },
    name: { type: String, trim: true },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      required: true,
    },
    osVersion: { type: String, default: '' },
    appVersion: { type: String, default: '' },
    pushToken: { type: String },
    isOnline: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
    lastSyncAt: { type: Date },
    isActive: { type: Boolean, default: true },
    isPrimary: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

deviceSchema.index({ childId: 1, isActive: 1 });

export const Device = model('Device', deviceSchema);
