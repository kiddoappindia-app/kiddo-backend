import { Schema, model, Types } from 'mongoose';

export interface IPermissionOverride {
  userId: Types.ObjectId;
  allow: string[];
  deny: string[];
  enabled: boolean;
}

const permissionOverrideSchema = new Schema<IPermissionOverride>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    allow: [{ type: String, trim: true, lowercase: true }],
    deny: [{ type: String, trim: true, lowercase: true }],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const PermissionOverride = model<IPermissionOverride>(
  'PermissionOverride',
  permissionOverrideSchema,
);
