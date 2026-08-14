import { SeasonalEvent, EventParticipation, ISeasonalEvent } from '../models/seasonal-event.model.js';
import { Logger } from '../utils/logger.js';

export class SeasonalEventEngineService {
  static async getActiveEvents() {
    const now = new Date();
    return SeasonalEvent.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ sortOrder: 1 });
  }

  static async getUpcomingEvents() {
    const now = new Date();
    return SeasonalEvent.find({
      isActive: true,
      startDate: { $gt: now },
    }).sort({ startDate: 1 }).limit(5);
  }

  static async getEventByKey(key: string) {
    return SeasonalEvent.findOne({ key });
  }

  static async participateInEvent(childId: string, familyId: string, eventKey: string) {
    const event = await SeasonalEvent.findOne({ key: eventKey, isActive: true });
    if (!event) throw new Error('Event not found or inactive');

    const now = new Date();
    if (now < event.startDate || now > event.endDate) throw new Error('Event is not currently active');

    let participation = await EventParticipation.findOne({ childId, eventKey });
    if (!participation) {
      participation = new EventParticipation({
        childId,
        eventId: event._id,
        eventKey,
        target: 100,
      });
      await participation.save();
      Logger.info(`Child ${childId} joined event ${eventKey}`);
    }
    return participation;
  }

  static async checkInEvent(childId: string, eventKey: string) {
    const participation = await EventParticipation.findOne({ childId, eventKey, isActive: true });
    if (!participation) throw new Error('Not participating in this event');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyCheckedIn = participation.dailyCheckIns.some(d => {
      const checkDate = new Date(d);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate.getTime() === today.getTime();
    });

    if (!alreadyCheckedIn) {
      participation.dailyCheckIns.push(new Date());
      participation.progress += 10;
      participation.totalPointsEarned += 10;
      await participation.save();
    }

    return participation;
  }

  static async claimEventReward(childId: string, eventKey: string, rewardId: string) {
    const participation = await EventParticipation.findOne({ childId, eventKey, isActive: true });
    if (!participation) throw new Error('Not participating');

    if (participation.rewardsClaimed.includes(rewardId)) throw new Error('Already claimed');

    participation.rewardsClaimed.push(rewardId);
    await participation.save();
    return participation;
  }

  static async getEventParticipation(childId: string, eventKey: string) {
    return EventParticipation.findOne({ childId, eventKey });
  }

  static async getChildEventParticipations(childId: string) {
    return EventParticipation.find({ childId, isActive: true }).sort({ createdAt: -1 });
  }

  static async calculateEventBonus(eventKey: string, baseAmount: number, type: 'reward' | 'xp' | 'coin') {
    const event = await SeasonalEvent.findOne({ key: eventKey, isActive: true });
    if (!event) return baseAmount;

    const now = new Date();
    if (now < event.startDate || now > event.endDate) return baseAmount;

    const multiplierMap = {
      reward: event.config.rewardMultiplier,
      xp: event.config.xpMultiplier,
      coin: event.config.coinMultiplier,
    };

    return Math.round(baseAmount * (multiplierMap[type] || 1));
  }

  static async isEventActive(eventKey: string) {
    const event = await SeasonalEvent.findOne({ key: eventKey, isActive: true });
    if (!event) return false;
    const now = new Date();
    return now >= event.startDate && now <= event.endDate;
  }

  static async getEventConfig(eventKey: string) {
    const event = await SeasonalEvent.findOne({ key: eventKey });
    if (!event) return null;
    return {
      multiplier: event.config.rewardMultiplier,
      exclusiveItems: event.config.exclusiveItems,
      exclusivePets: event.config.exclusivePets,
      dailyBonus: event.config.dailyBonus,
      themeId: event.config.themeId,
      colors: event.config.colors,
    };
  }
}
