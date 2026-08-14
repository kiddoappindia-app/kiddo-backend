import { Request, Response } from 'express';
import { DailyJourneyEngineService } from '../services/daily-journey-engine.service.js';

export class DailyJourneyController {
  static async getTodayJourney(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const familyId = (req as any).familyId || 'unknown';
      const journey = await DailyJourneyEngineService.getOrCreateDailyJourney(userId, familyId);
      res.json(journey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async claimDailyGift(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const journey = await DailyJourneyEngineService.claimDailyGift(userId);
      res.json(journey);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async updateMissionProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { missionId, increment } = req.body;
      const mission = await DailyJourneyEngineService.updateMissionProgress(userId, missionId, increment);
      res.json(mission);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async claimMissionReward(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { missionId } = req.body;
      const mission = await DailyJourneyEngineService.claimMissionReward(userId, missionId);
      res.json(mission);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async claimChallengeReward(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const journey = await DailyJourneyEngineService.claimChallengeReward(userId);
      res.json(journey);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async showSurprise(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { surpriseId } = req.body;
      const surprise = await DailyJourneyEngineService.showSurprise(userId, surpriseId);
      res.json(surprise);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async claimSurprise(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { surpriseId } = req.body;
      const surprise = await DailyJourneyEngineService.claimSurprise(userId, surpriseId);
      res.json(surprise);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { days } = req.query;
      const history = await DailyJourneyEngineService.getJourneyHistory(userId, Number(days) || 7);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const stats = await DailyJourneyEngineService.getJourneyStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
