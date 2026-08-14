import { DailyJourney, DailyJourneyConfig } from '../models/daily-journey.model.js';
import { Logger } from '../utils/logger.js';

const DAILY_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
];

const DAILY_MISSION_TEMPLATES = [
  { type: 'task_complete', title: 'Complete 3 Tasks', description: 'Finish any 3 tasks today', target: 3, reward: { coins: 10, xp: 15, stars: 1 } },
  { type: 'task_complete', title: 'Complete 5 Tasks', description: 'Finish any 5 tasks today', target: 5, reward: { coins: 20, xp: 30, stars: 2 } },
  { type: 'game_play', title: 'Play a Game', description: 'Play any mini-game', target: 1, reward: { coins: 5, xp: 10, stars: 0 } },
  { type: 'read', title: 'Read for 15 Minutes', description: 'Spend time reading', target: 1, reward: { coins: 8, xp: 12, stars: 1 } },
  { type: 'exercise', title: 'Get Moving', description: 'Complete an exercise task', target: 1, reward: { coins: 8, xp: 12, stars: 1 } },
  { type: 'custom', title: 'Help Someone', description: 'Do something kind for others', target: 1, reward: { coins: 10, xp: 15, stars: 1 } },
];

const SURPRISE_TEMPLATES = [
  { type: 'bonus_coins', title: 'Bonus Coins!', description: 'You found hidden coins!', icon: '🪙' },
  { type: 'bonus_xp', title: 'XP Boost!', description: 'Extra experience points!', icon: '⭐' },
  { type: 'mascot_dance', title: 'Mascot Dance!', description: 'Your mascot is dancing for you!', icon: '💃' },
  { type: 'treasure', title: 'Treasure Found!', description: 'You discovered a treasure chest!', icon: '🎁' },
];

export class DailyJourneyEngineService {
  static async getOrCreateDailyJourney(childId: string, familyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let journey = await DailyJourney.findOne({ childId, date: today });
    if (!journey) {
      journey = await this.createDailyJourney(childId, familyId, today);
    }
    return journey;
  }

  private static async createDailyJourney(childId: string, familyId: string, date: Date) {
    const config = await DailyJourneyConfig.findOne() || { dailyMissionsCount: 3, dailyGiftBase: { coins: 5, xp: 10, stars: 1 } };

    const missionCount = Math.min(config.dailyMissionsCount, DAILY_MISSION_TEMPLATES.length);
    const shuffledMissions = [...DAILY_MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    const selectedMissions = shuffledMissions.slice(0, missionCount).map((m, i) => ({
      missionId: `daily_${date.getTime()}_${i}`,
      ...m,
      progress: 0,
      completed: false,
      claimed: false,
    }));

    const quote = DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
    const challengeId = `challenge_${date.getTime()}`;

    const surpriseCount = Math.floor(Math.random() * 2) + 1;
    const surprises = [];
    for (let i = 0; i < surpriseCount; i++) {
      const template = SURPRISE_TEMPLATES[Math.floor(Math.random() * SURPRISE_TEMPLATES.length)];
      surprises.push({
        id: `surprise_${date.getTime()}_${i}`,
        ...template,
        shown: false,
        claimed: false,
      });
    }

    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayJourney = await DailyJourney.findOne({ childId, date: yesterday });
    const loginStreak = yesterdayJourney ? yesterdayJourney.loginStreak + 1 : 1;

    const journey = new DailyJourney({
      childId,
      familyId,
      date,
      dailyGift: {
        claimed: false,
        giftType: loginStreak >= 7 ? 'golden' : loginStreak >= 3 ? 'silver' : 'standard',
        reward: {
          coins: (config as any).dailyGiftBase?.coins || 5,
          xp: (config as any).dailyGiftBase?.xp || 10,
          stars: (config as any).dailyGiftBase?.stars || 1,
        },
      },
      dailyMissions: selectedMissions,
      dailyQuote: { ...quote, shown: false },
      dailyChallenge: {
        id: challengeId,
        title: 'Daily Challenge',
        description: 'Complete all your daily missions',
        type: 'completion',
        target: missionCount,
        progress: 0,
        completed: false,
        claimed: false,
        reward: { coins: 25, xp: 40, stars: 3 },
      },
      surprises,
      loginStreak,
    });

    await journey.save();
    Logger.info(`Daily journey created for child ${childId}, login streak: ${loginStreak}`);
    return journey;
  }

  static async claimDailyGift(childId: string) {
    const journey = await this.getOrCreateDailyJourney(childId, 'unknown');
    if (journey.dailyGift.claimed) throw new Error('Daily gift already claimed');

    journey.dailyGift.claimed = true;
    journey.dailyGift.claimedAt = new Date();
    journey.totalXpEarned += journey.dailyGift.reward.xp;
    journey.totalCoinsEarned += journey.dailyGift.reward.coins;
    await journey.save();
    return journey;
  }

  static async updateMissionProgress(childId: string, missionId: string, increment: number = 1) {
    const journey = await this.getOrCreateDailyJourney(childId, 'unknown');
    const mission = journey.dailyMissions.find(m => m.missionId === missionId);
    if (!mission) throw new Error('Mission not found');

    mission.progress = Math.min(mission.progress + increment, mission.target);
    if (mission.progress >= mission.target) {
      mission.completed = true;
    }

    journey.dailyChallenge.progress = journey.dailyMissions.filter(m => m.completed).length;
    if (journey.dailyChallenge.progress >= journey.dailyChallenge.target) {
      journey.dailyChallenge.completed = true;
    }

    await journey.save();
    return mission;
  }

  static async claimMissionReward(childId: string, missionId: string) {
    const journey = await this.getOrCreateDailyJourney(childId, 'unknown');
    const mission = journey.dailyMissions.find(m => m.missionId === missionId);
    if (!mission) throw new Error('Mission not found');
    if (!mission.completed) throw new Error('Mission not completed');
    if (mission.claimed) throw new Error('Already claimed');

    mission.claimed = true;
    journey.totalXpEarned += mission.reward.xp;
    journey.totalCoinsEarned += mission.reward.coins;
    await journey.save();
    return mission;
  }

  static async claimChallengeReward(childId: string) {
    const journey = await this.getOrCreateDailyJourney(childId, 'unknown');
    if (!journey.dailyChallenge.completed) throw new Error('Challenge not completed');
    if (journey.dailyChallenge.claimed) throw new Error('Already claimed');

    journey.dailyChallenge.claimed = true;
    journey.totalXpEarned += journey.dailyChallenge.reward.xp;
    journey.totalCoinsEarned += journey.dailyChallenge.reward.coins;
    await journey.save();
    return journey;
  }

  static async showSurprise(childId: string, surpriseId: string) {
    const journey = await this.getOrCreateDailyJourney(childId, 'unknown');
    const surprise = journey.surprises.find(s => s.id === surpriseId);
    if (!surprise) throw new Error('Surprise not found');
    surprise.shown = true;
    await journey.save();
    return surprise;
  }

  static async claimSurprise(childId: string, surpriseId: string) {
    const journey = await this.getOrCreateDailyJourney(childId, 'unknown');
    const surprise = journey.surprises.find(s => s.id === surpriseId);
    if (!surprise) throw new Error('Surprise not found');
    if (surprise.claimed) throw new Error('Already claimed');

    surprise.claimed = true;
    if (surprise.type === 'bonus_coins') {
      journey.totalCoinsEarned += 10;
    } else if (surprise.type === 'bonus_xp') {
      journey.totalXpEarned += 15;
    }
    await journey.save();
    return surprise;
  }

  static async getJourneyHistory(childId: string, days: number = 7) {
    const journeys = await DailyJourney.find({ childId })
      .sort({ date: -1 })
      .limit(days);
    return journeys;
  }

  static async getJourneyStats(childId: string) {
    const journeys = await DailyJourney.find({ childId }).sort({ date: -1 }).limit(30);
    return {
      totalDays: journeys.length,
      currentStreak: journeys.length > 0 ? journeys[0].loginStreak : 0,
      totalXpEarned: journeys.reduce((sum, j) => sum + j.totalXpEarned, 0),
      totalCoinsEarned: journeys.reduce((sum, j) => sum + j.totalCoinsEarned, 0),
      missionsCompleted: journeys.reduce((sum, j) => sum + j.dailyMissions.filter(m => m.completed).length, 0),
      challengesCompleted: journeys.reduce((sum, j) => sum + (j.dailyChallenge.completed ? 1 : 0), 0),
      avgMissionsPerDay: journeys.length > 0
        ? Math.round(journeys.reduce((sum, j) => sum + j.dailyMissions.filter(m => m.completed).length, 0) / journeys.length * 10) / 10
        : 0,
    };
  }
}
