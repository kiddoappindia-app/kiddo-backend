import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as permService from '../services/permission-management.service.js';

export const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await permService.getChildPermissions(
    req.params.childId as string,
    req.user!.familyId!,
  );
  res.status(StatusCodes.OK).json(result);
});

export const updatePermissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await permService.updateChildPermissions(
    req.params.childId as string,
    req.user!.familyId!,
    req.body,
  );
  res.status(StatusCodes.OK).json(result);
});

export const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await permService.getAllChildrenPermissions(req.user!.familyId!);
  res.status(StatusCodes.OK).json({ children: result });
});
