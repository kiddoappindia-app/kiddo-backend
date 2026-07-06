import { Schema, model, Types } from 'mongoose';

export interface IAdminAuditLog {
  actorId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, required: true, trim: true },
    targetId: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, immutable: true, index: true },
  },
  { versionKey: false },
);

export const AdminAuditLog = model<IAdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
