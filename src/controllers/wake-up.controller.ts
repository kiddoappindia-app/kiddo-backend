import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as wakeUpService from '../services/wake-up.service.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const completeWakeUp = asyncHandler(async (req: Request, res: Response) => {
  const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : new Date();
  const result = await wakeUpService.completeWakeUp(getParam(req.params.childId), req.user!.familyId!, completedAt);
  res.status(StatusCodes.CREATED).json(result);
});

export const getWakeUpHistory = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const history = await wakeUpService.getWakeUpHistory(getParam(req.params.childId), req.user!.familyId!, limit);
  res.status(StatusCodes.OK).json(history);
});

export const getTodayStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await wakeUpService.getTodayWakeUpStatus(getParam(req.params.childId), req.user!.familyId!);
  res.status(StatusCodes.OK).json(status);
});
