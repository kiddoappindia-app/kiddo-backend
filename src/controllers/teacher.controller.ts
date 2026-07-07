import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import * as teacherService from '../services/teacher.service.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.createTeacher(req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(teacher);
});

export const activateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const payload = await teacherService.activateTeacher(req.body);
  res.status(StatusCodes.OK).json(payload);
});

export const teacherLogin = asyncHandler(async (req: Request, res: Response) => {
  const payload = await teacherService.teacherLogin(req.body);
  res.status(StatusCodes.OK).json(payload);
});

export const getTeacherProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await teacherService.getTeacherProfile(req.user!.id);
  res.status(StatusCodes.OK).json(profile);
});

export const updateTeacherProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await teacherService.updateTeacherProfile(req.user!.id, req.body);
  res.status(StatusCodes.OK).json(profile);
});

export const getTeacherDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await teacherService.getTeacherDashboard(req.user!.id);
  res.status(StatusCodes.OK).json(dashboard);
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await teacherService.createClass(req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(cls);
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await teacherService.updateClass(req.user!.id, getParam(req.params.classId), req.body);
  res.status(StatusCodes.OK).json(cls);
});

export const archiveClass = asyncHandler(async (req: Request, res: Response) => {
  const result = await teacherService.archiveClass(req.user!.id, getParam(req.params.classId));
  res.status(StatusCodes.OK).json(result);
});

export const getTeacherClasses = asyncHandler(async (req: Request, res: Response) => {
  const classes = await teacherService.getTeacherClasses(req.user!.id);
  res.status(StatusCodes.OK).json(classes);
});

export const addStudentToClass = asyncHandler(async (req: Request, res: Response) => {
  const result = await teacherService.addStudentToClass(req.user!.id, getParam(req.params.classId), req.body.childId);
  res.status(StatusCodes.OK).json(result);
});

export const removeStudentFromClass = asyncHandler(async (req: Request, res: Response) => {
  const result = await teacherService.removeStudentFromClass(req.user!.id, getParam(req.params.classId), getParam(req.params.childId));
  res.status(StatusCodes.OK).json(result);
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const students = await teacherService.getClassStudents(req.user!.id, getParam(req.params.classId));
  res.status(StatusCodes.OK).json(students);
});

export const inviteStudentByCode = asyncHandler(async (req: Request, res: Response) => {
  const result = await teacherService.inviteStudentByCode(req.user!.id, getParam(req.params.classId), req.body.childLoginCode);
  res.status(StatusCodes.OK).json(result);
});

export const createTeacherTask = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await teacherService.createTeacherTask(req.user!.id, req.body);
  res.status(StatusCodes.CREATED).json(tasks);
});

export const awardBonusPoints = asyncHandler(async (req: Request, res: Response) => {
  const { childId, points, reason } = req.body;
  const result = await teacherService.awardBonusPoints(req.user!.id, childId, points, reason);
  res.status(StatusCodes.OK).json(result);
});

export const getClassLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const leaderboard = await teacherService.getClassLeaderboard(getParam(req.params.classId));
  res.status(StatusCodes.OK).json(leaderboard);
});

export const awardBadge = asyncHandler(async (req: Request, res: Response) => {
  const { childId, badgeTitle, reason } = req.body;
  const result = await teacherService.awardBadge(req.user!.id, childId, badgeTitle, reason);
  res.status(StatusCodes.OK).json(result);
});

export const getSchoolLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { schoolName, period } = req.query;
  const leaderboard = await teacherService.getSchoolLeaderboard(schoolName as string, period as 'weekly' | 'monthly' | undefined);
  res.status(StatusCodes.OK).json(leaderboard);
});

export const getChildTeacherInfo = asyncHandler(async (req: Request, res: Response) => {
  const info = await teacherService.getChildTeacherInfo(req.user!.id);
  if (!info) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: 'No teacher or class assigned' });
  }
  res.status(StatusCodes.OK).json(info);
});

// ---------------------------------------------------------------------------
// Teacher: specific reward actions
// ---------------------------------------------------------------------------

export const awardAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'attendance_reward', 'Attendance');
  res.status(StatusCodes.OK).json(result);
});

export const awardHomework = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'homework_completed', 'Homework');
  res.status(StatusCodes.OK).json(result);
});

export const awardQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'quiz_completion', 'Quiz');
  res.status(StatusCodes.OK).json(result);
});

export const awardBehaviour = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'teacher_bonus', 'Behaviour');
  res.status(StatusCodes.OK).json(result);
});

export const awardParticipation = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'teacher_bonus', 'Participation');
  res.status(StatusCodes.OK).json(result);
});

export const awardReading = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'reading_goal', 'Reading');
  res.status(StatusCodes.OK).json(result);
});

export const awardChallenge = asyncHandler(async (req: Request, res: Response) => {
  const { childId } = req.body;
  const result = await teacherService.awardAction(req.user!.id, childId, 'monthly_challenge', 'Challenge');
  res.status(StatusCodes.OK).json(result);
});
