import type { Role } from '../constants/roles.js';
import type { Permission } from '../constants/permissions.js';

export interface AuthUser {
  id: string;
  role: Role;
  familyId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
