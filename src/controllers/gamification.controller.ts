import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GamificationService } from '../services/gamification.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ApiError } from '../utils/api-error.js';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

// ===========================================================================
// PROGRESS
// ===========================================================================

export const getUserProgress = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.getUserProgress(req.user!.id);
  res.json(result);
});

// ===========================================================================
// XP & LEVEL
// ===========================================================================

export const addXP = asyncHandler(async (req: Request, res: Response) => {
  const { amount, source } = req.body;
  if (!amount || amount <= 0) throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid amount required');
  const result = await GamificationService.addXP(req.user!.id, amount, source ?? 'system');
  res.json(result);
});

// ===========================================================================
// ACHIEVEMENTS
// ===========================================================================

export const getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.getUserAchievements(req.user!.id);
  res.json(result);
});

export const evaluateAchievement = asyncHandler(async (req: Request, res: Response) => {
  const { criteriaType, currentValue } = req.body;
  if (!criteriaType || currentValue === undefined) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'criteriaType and currentValue required');
  }
  const result = await GamificationService.evaluateAchievement(req.user!.id, criteriaType, currentValue);
  res.json(result);
});

// ===========================================================================
// BADGES
// ===========================================================================

export const getUserBadges = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.getUserBadges(req.user!.id);
  res.json(result);
});

// ===========================================================================
// CHALLENGES
// ===========================================================================

export const getUserChallenges = asyncHandler(async (req: Request, res: Response) => {
  const type = getParam(req.query.type as string | undefined);
  const result = await GamificationService.getUserChallenges(req.user!.id, type || undefined);
  res.json(result);
});

export const getActiveChallenges = asyncHandler(async (req: Request, res: Response) => {
  const type = getParam(req.query.type as string | undefined);
  const result = await GamificationService.getActiveChallenges(type || undefined);
  res.json(result);
});

export const claimChallengeReward = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = getParam(req.params.challengeId);
  const result = await GamificationService.claimChallengeReward(req.user!.id, challengeId);
  res.json(result);
});

// ===========================================================================
// STREAKS
// ===========================================================================

export const getStreakInfo = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.getStreakInfo(req.user!.id);
  res.json(result);
});

export const updateStreak = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.updateStreak(req.user!.id);
  res.json(result);
});

// ===========================================================================
// LOGIN REWARDS
// ===========================================================================

export const processLoginReward = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.processLoginReward(req.user!.id);
  res.json(result);
});

// ===========================================================================
// MISSIONS
// ===========================================================================

export const getUserMissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.getUserMissions(req.user!.id);
  res.json(result);
});

export const completeMission = asyncHandler(async (req: Request, res: Response) => {
  const missionId = getParam(req.params.missionId);
  const result = await GamificationService.completeMission(req.user!.id, missionId);
  res.json(result);
});

// ===========================================================================
// EVENTS
// ===========================================================================

export const getActiveEvents = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.getActiveEvents();
  res.json(result);
});

// ===========================================================================
// LEADERBOARD
// ===========================================================================

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const type = (getParam(req.query.type as string) || 'xp') as 'xp' | 'level' | 'streak' | 'points';
  const limit = parseInt(getParam(req.query.limit as string), 10) || 50;
  const school = getParam(req.query.school as string) || undefined;
  const result = await GamificationService.getLeaderboard(req.user!.familyId, school, type, limit);
  res.json(result);
});

// ===========================================================================
// ANALYTICS
// ===========================================================================

export const getPlatformAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.getPlatformAnalytics();
  res.json(result);
});

// ===========================================================================
// ADMIN: CRUD
// ===========================================================================

// -- Achievements --
export const listAchievements = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.listAchievements();
  res.json(result);
});

export const createAchievement = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.createAchievement(req.body);
  res.status(StatusCodes.CREATED).json(result);
});

export const updateAchievement = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.updateAchievement(id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Achievement not found');
  res.json(result);
});

export const deleteAchievement = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.deleteAchievement(id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Achievement not found');
  res.json({ success: true });
});

// -- Badges --
export const listBadges = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.listBadges();
  res.json(result);
});

export const createBadge = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.createBadge(req.body);
  res.status(StatusCodes.CREATED).json(result);
});

export const updateBadge = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.updateBadge(id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Badge not found');
  res.json(result);
});

export const deleteBadge = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.deleteBadge(id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Badge not found');
  res.json({ success: true });
});

// -- Challenges --
export const listAllChallenges = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.listAllChallenges();
  res.json(result);
});

export const createChallenge = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.createChallenge({ ...req.body, createdBy: req.user!.id });
  res.status(StatusCodes.CREATED).json(result);
});

export const updateChallenge = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.updateChallenge(id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found');
  res.json(result);
});

export const deleteChallenge = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.deleteChallenge(id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Challenge not found');
  res.json({ success: true });
});

// -- Events --
export const listEvents = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.listEvents();
  res.json(result);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.createEvent({ ...req.body, createdBy: req.user!.id });
  res.status(StatusCodes.CREATED).json(result);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.updateEvent(id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  res.json(result);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.deleteEvent(id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  res.json({ success: true });
});

// -- Missions --
export const listMissions = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.listMissions();
  res.json(result);
});

export const createMission = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.createMission({ ...req.body, createdBy: req.user!.id });
  res.status(StatusCodes.CREATED).json(result);
});

export const updateMission = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.updateMission(id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Mission not found');
  res.json(result);
});

export const deleteMission = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.deleteMission(id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Mission not found');
  res.json({ success: true });
});

// -- Milestones --
export const listMilestones = asyncHandler(async (_req: Request, res: Response) => {
  const result = await GamificationService.listMilestones();
  res.json(result);
});

export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.createMilestone({ ...req.body, createdBy: req.user!.id });
  res.status(StatusCodes.CREATED).json(result);
});

export const updateMilestone = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.updateMilestone(id, req.body);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Milestone not found');
  res.json(result);
});

export const deleteMilestone = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req.params.id);
  const result = await GamificationService.deleteMilestone(id);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, 'Milestone not found');
  res.json({ success: true });
});

// ===========================================================================
// MILESTONES (user-facing)
// ===========================================================================

export const evaluateMilestones = asyncHandler(async (req: Request, res: Response) => {
  const result = await GamificationService.evaluateMilestones(req.user!.id);
  res.json(result);
});
