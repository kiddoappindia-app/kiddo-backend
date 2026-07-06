import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { Permission } from '../constants/permissions.js';
import { PermissionService } from '../services/permission.service.js';
import { ApiError } from '../utils/api-error.js';

export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized'));
    }

    try {
      const allowed = await PermissionService.hasAnyPermission(
        req.user.id,
        req.user.role,
        permissions,
      );
      if (!allowed) {
        return next(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'));
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
