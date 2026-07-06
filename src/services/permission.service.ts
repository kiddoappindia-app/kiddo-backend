import type { Permission } from '../constants/permissions.js';
import { PermissionRepository } from '../repositories/permission.repository.js';

export class PermissionService {
  static async getPermissions(userId: string, roleKey: string): Promise<Set<string>> {
    const [role, override] = await Promise.all([
      PermissionRepository.findEnabledRole(roleKey),
      PermissionRepository.findEnabledOverride(userId),
    ]);

    const permissions = new Set<string>(role?.permissions ?? []);
    for (const permission of override?.allow ?? []) permissions.add(permission);
    for (const permission of override?.deny ?? []) permissions.delete(permission);
    return permissions;
  }

  static async hasAnyPermission(
    userId: string,
    roleKey: string,
    required: readonly Permission[],
  ) {
    const permissions = await this.getPermissions(userId, roleKey);
    return required.some(permission => permissions.has(permission));
  }
}
