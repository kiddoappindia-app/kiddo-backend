import { AccessRole } from '../models/access-role.model.js';
import { PermissionOverride } from '../models/permission-override.model.js';

export class PermissionRepository {
  static findEnabledRole(roleKey: string) {
    return AccessRole.findOne({ key: roleKey, enabled: true }).lean();
  }

  static findEnabledOverride(userId: string) {
    return PermissionOverride.findOne({ userId, enabled: true }).lean();
  }
}
