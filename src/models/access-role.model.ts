import { Schema, model } from 'mongoose';

export interface IAccessRole {
  key: string;
  permissions: string[];
  enabled: boolean;
}

const accessRoleSchema = new Schema<IAccessRole>(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    permissions: [{ type: String, required: true, trim: true, lowercase: true }],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

accessRoleSchema.index({ key: 1, enabled: 1 });

export const AccessRole = model<IAccessRole>('AccessRole', accessRoleSchema);
