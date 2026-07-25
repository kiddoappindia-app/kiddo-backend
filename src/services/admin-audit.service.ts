import { AdminAuditRepository } from '../repositories/admin-audit.repository.js';

export class AdminAuditService {
  static record(entry: {
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return AdminAuditRepository.create(entry);
  }
}
