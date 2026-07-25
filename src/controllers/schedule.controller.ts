import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as scheduleService from '../services/schedule.service.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await scheduleService.getWeeklySchedule(getParam(req.params.childId), req.user!.familyId!);
  res.status(StatusCodes.OK).json(schedule);
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await scheduleService.updateWeeklySchedule(getParam(req.params.childId), req.user!.familyId!, req.body);
  res.status(StatusCodes.OK).json(schedule);
});

export const getWakeUpSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await scheduleService.getWakeUpSettings(getParam(req.params.childId), req.user!.familyId!);
  res.status(StatusCodes.OK).json(settings);
});

export const updateWakeUpSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await scheduleService.updateWakeUpSettings(getParam(req.params.childId), req.user!.familyId!, req.body);
  res.status(StatusCodes.OK).json(settings);
});

export const checkTodaySchoolDay = asyncHandler(async (req: Request, res: Response) => {
  const isSchoolDay = await scheduleService.isTodaySchoolDay(getParam(req.params.childId), req.user!.familyId!);
  res.status(StatusCodes.OK).json({ isSchoolDay });
});
