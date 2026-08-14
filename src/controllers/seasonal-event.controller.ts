import { Request, Response } from 'express';
import { SeasonalEventEngineService } from '../services/seasonal-event-engine.service.js';

export class SeasonalEventController {
  static async getActiveEvents(req: Request, res: Response) {
    try {
      const events = await SeasonalEventEngineService.getActiveEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getUpcomingEvents(req: Request, res: Response) {
    try {
      const events = await SeasonalEventEngineService.getUpcomingEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async participate(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const familyId = (req as any).familyId || 'unknown';
      const { eventKey } = req.body;
      const participation = await SeasonalEventEngineService.participateInEvent(userId, familyId, eventKey);
      res.json(participation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async checkIn(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { eventKey } = req.body;
      const participation = await SeasonalEventEngineService.checkInEvent(userId, eventKey);
      res.json(participation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async claimReward(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { eventKey, rewardId } = req.body;
      const participation = await SeasonalEventEngineService.claimEventReward(userId, eventKey, rewardId);
      res.json(participation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getMyParticipation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const participations = await SeasonalEventEngineService.getChildEventParticipations(userId);
      res.json(participations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
