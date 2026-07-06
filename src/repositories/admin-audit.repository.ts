import { AdminAuditLog } from '../models/admin-audit-log.model.js';

export class AdminAuditRepository {
  static create(entry: {
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return AdminAuditLog.create({ ...entry, metadata: entry.metadata ?? {} });
  }
}
