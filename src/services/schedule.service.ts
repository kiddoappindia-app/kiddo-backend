import { StatusCodes } from 'http-status-codes';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DEFAULT_SCHEDULE: Record<DayOfWeek, boolean> = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
};

export async function getWeeklySchedule(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' }).select('weeklySchedule').lean();
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }
  return child.weeklySchedule || DEFAULT_SCHEDULE;
}

export async function updateWeeklySchedule(
  childId: string,
  familyId: string,
  schedule: Record<string, boolean>,
) {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const validDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  for (const [day, value] of Object.entries(schedule)) {
    if (validDays.includes(day as DayOfWeek)) {
      (child.weeklySchedule as any)[day] = Boolean(value);
    }
  }

  await child.save();
  return child.weeklySchedule;
}

export async function getWakeUpSettings(childId: string, familyId: string) {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' }).select('wakeUpSettings').lean();
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }
  return child.wakeUpSettings || { targetTime: '06:30', mandatory: true };
}

export async function updateWakeUpSettings(
  childId: string,
  familyId: string,
  settings: { targetTime?: string },
) {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  if (settings.targetTime) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(settings.targetTime)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid time format. Use HH:MM (24-hour)');
    }
    if (!child.wakeUpSettings) { child.wakeUpSettings = { targetTime: '06:30', mandatory: true }; }
    child.wakeUpSettings.targetTime = settings.targetTime;
  }

  await child.save();
  return child.wakeUpSettings || { targetTime: '06:30', mandatory: true };
}

export async function isTodaySchoolDay(childId: string, familyId: string): Promise<boolean> {
  const child = await User.findOne({ _id: childId, familyId, role: 'child' }).select('weeklySchedule').lean();
  if (!child || !child.weeklySchedule) {
    return true;
  }

  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  return (child.weeklySchedule as any)[today] ?? true;
}
