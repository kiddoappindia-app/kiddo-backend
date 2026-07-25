import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';
import * as gamifyCtrl from '../controllers/gamification.controller.js';

const router = Router();

router.use(authenticate);

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER PROGRESS (all authenticated users)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/progress', gamifyCtrl.getUserProgress);
router.post('/xp', authorize(ROLES.CHILD), gamifyCtrl.addXP);

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/achievements', gamifyCtrl.getUserAchievements);
router.post('/achievements/evaluate', authorize(ROLES.CHILD), gamifyCtrl.evaluateAchievement);

// ═══════════════════════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/badges', gamifyCtrl.getUserBadges);

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/challenges/active', gamifyCtrl.getActiveChallenges);
router.get('/challenges', gamifyCtrl.getUserChallenges);
router.post('/challenges/:challengeId/claim', authorize(ROLES.CHILD), gamifyCtrl.claimChallengeReward);

// ═══════════════════════════════════════════════════════════════════════════════
// STREAKS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/streak', gamifyCtrl.getStreakInfo);
router.post('/streak/update', authorize(ROLES.CHILD), gamifyCtrl.updateStreak);

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN REWARDS
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/login-reward', authorize(ROLES.CHILD), gamifyCtrl.processLoginReward);

// ═══════════════════════════════════════════════════════════════════════════════
// MISSIONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/missions', gamifyCtrl.getUserMissions);
router.post('/missions/:missionId/complete', authorize(ROLES.CHILD), gamifyCtrl.completeMission);

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/events/active', gamifyCtrl.getActiveEvents);

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/milestones/evaluate', gamifyCtrl.evaluateMilestones);

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/leaderboard', gamifyCtrl.getLeaderboard);

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/analytics',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  gamifyCtrl.getPlatformAnalytics,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: ACHIEVEMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/achievements',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ACHIEVEMENT_MANAGE),
  gamifyCtrl.listAchievements,
);
router.post(
  '/admin/achievements',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ACHIEVEMENT_MANAGE),
  gamifyCtrl.createAchievement,
);
router.patch(
  '/admin/achievements/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ACHIEVEMENT_MANAGE),
  gamifyCtrl.updateAchievement,
);
router.delete(
  '/admin/achievements/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.ACHIEVEMENT_MANAGE),
  gamifyCtrl.deleteAchievement,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: BADGE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/badges',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.BADGE_MANAGE),
  gamifyCtrl.listBadges,
);
router.post(
  '/admin/badges',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.BADGE_MANAGE),
  gamifyCtrl.createBadge,
);
router.patch(
  '/admin/badges/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.BADGE_MANAGE),
  gamifyCtrl.updateBadge,
);
router.delete(
  '/admin/badges/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.BADGE_MANAGE),
  gamifyCtrl.deleteBadge,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: CHALLENGE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/challenges',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.CHALLENGE_MANAGE),
  gamifyCtrl.listAllChallenges,
);
router.post(
  '/admin/challenges',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.CHALLENGE_MANAGE),
  gamifyCtrl.createChallenge,
);
router.patch(
  '/admin/challenges/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.CHALLENGE_MANAGE),
  gamifyCtrl.updateChallenge,
);
router.delete(
  '/admin/challenges/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.CHALLENGE_MANAGE),
  gamifyCtrl.deleteChallenge,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/events',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.EVENT_MANAGE),
  gamifyCtrl.listEvents,
);
router.post(
  '/admin/events',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.EVENT_MANAGE),
  gamifyCtrl.createEvent,
);
router.patch(
  '/admin/events/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.EVENT_MANAGE),
  gamifyCtrl.updateEvent,
);
router.delete(
  '/admin/events/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.EVENT_MANAGE),
  gamifyCtrl.deleteEvent,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: MISSIONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/missions',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MISSION_MANAGE),
  gamifyCtrl.listMissions,
);
router.post(
  '/admin/missions',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MISSION_MANAGE),
  gamifyCtrl.createMission,
);
router.patch(
  '/admin/missions/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MISSION_MANAGE),
  gamifyCtrl.updateMission,
);
router.delete(
  '/admin/missions/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MISSION_MANAGE),
  gamifyCtrl.deleteMission,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  '/admin/milestones',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MILESTONE_MANAGE),
  gamifyCtrl.listMilestones,
);
router.post(
  '/admin/milestones',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MILESTONE_MANAGE),
  gamifyCtrl.createMilestone,
);
router.patch(
  '/admin/milestones/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MILESTONE_MANAGE),
  gamifyCtrl.updateMilestone,
);
router.delete(
  '/admin/milestones/:id',
  authorize(ROLES.ADMIN),
  requirePermission(PERMISSIONS.MILESTONE_MANAGE),
  gamifyCtrl.deleteMilestone,
);

export default router;
