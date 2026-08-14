import { Request, Response } from 'express';
import { AchievementEngine } from '../services/achievement-engine.service.js';
import { StreakEngine } from '../services/streak-engine.service.js';
import { AnalyticsEngine } from '../services/analytics-engine.service.js';

export class AchievementController {
  static async getAchievements(req: Request, res: Response) {
    try {
      const { category } = req.query;
      const achievements = await AchievementEngine.getDefinitions(category as string);
      res.json({ success: true, data: achievements });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getChildAchievements(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const achievements = await AchievementEngine.getChildAchievements(childId);
      res.json({ success: true, data: achievements });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAchievementProgress(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const progress = await AchievementEngine.getAchievementProgress(childId);
      res.json({ success: true, data: progress });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async claimAchievement(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const achievementId = req.params.achievementId as string;
      const achievement = await AchievementEngine.claimAchievement(childId, achievementId);
      res.json({ success: true, data: achievement });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUnclaimedCount(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const count = await AchievementEngine.getUnclaimedCount(childId);
      res.json({ success: true, data: { count } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async checkAchievements(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const newAchievements = await AchievementEngine.checkAchievements(
        childId,
        (req as any).user.familyId,
        req.body.metrics || {},
      );
      res.json({ success: true, data: newAchievements });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export class StreakController {
  static async getStreaks(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const streaks = await StreakEngine.getAllStreaks(childId);
      res.json({ success: true, data: streaks });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStreakStats(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const stats = await StreakEngine.getStreakStats(childId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async incrementStreak(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const streak = await StreakEngine.incrementStreak(
        childId,
        (req as any).user.familyId,
        req.body.streakType,
      );
      res.json({ success: true, data: streak });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStreakHistory(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const history = await StreakEngine.getStreakHistory(
        childId,
        req.query.streakType as any,
        Number(req.query.days) || 30,
      );
      res.json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export class AnalyticsController {
  static async getChildAnalytics(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const { startDate, endDate } = req.query;
      const analytics = await AnalyticsEngine.getChildAnalytics(
        childId,
        new Date(startDate as string),
        new Date(endDate as string),
      );
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFamilyAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const analytics = await AnalyticsEngine.getFamilyAnalytics(
        (req as any).user.familyId,
        new Date(startDate as string),
        new Date(endDate as string),
      );
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getHabitIntelligence(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const intelligence = await AnalyticsEngine.getHabitIntelligence(
        childId,
        Number(req.query.days) || 30,
      );
      res.json({ success: true, data: intelligence });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async generateSnapshot(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const snapshot = await AnalyticsEngine.generateDailySnapshot(
        childId,
        (req as any).user.familyId,
        new Date(req.body.date || Date.now()),
      );
      res.json({ success: true, data: snapshot });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
