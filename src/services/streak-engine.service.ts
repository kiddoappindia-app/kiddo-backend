import { Streak, IStreak, StreakType } from '../models/streak.model.js';

export class StreakEngine {
  static async getStreak(childId: string, streakType: StreakType): Promise<IStreak> {
    let streak = await Streak.findOne({ childId, streakType });
    if (!streak) {
      streak = await Streak.create({
        childId,
        familyId: '',
        streakType,
        currentCount: 0,
        longestCount: 0,
        isActive: true,
      });
    }
    return streak;
  }

  static async getAllStreaks(childId: string): Promise<IStreak[]> {
    return Streak.find({ childId }).sort({ streakType: 1 }).lean();
  }

  static async incrementStreak(
    childId: string,
    familyId: string,
    streakType: StreakType,
    date: Date = new Date(),
  ): Promise<IStreak> {
    let streak = await Streak.findOne({ childId, streakType });
    if (!streak) {
      streak = await Streak.create({
        childId,
        familyId,
        streakType,
        currentCount: 1,
        longestCount: 1,
        lastCompletedDate: date,
        startDate: date,
        isActive: true,
        history: [{ date, completed: true, count: 1 }],
        totalCompletions: 1,
      });
      return streak;
    }

    const lastDate = streak.lastCompletedDate;
    const isConsecutive = this.isConsecutiveDay(lastDate, date);

    if (isConsecutive) {
      streak.currentCount += 1;
    } else {
      streak.currentCount = 1;
    }

    if (streak.currentCount > streak.longestCount) {
      streak.longestCount = streak.currentCount;
    }

    streak.lastCompletedDate = date;
    streak.totalCompletions += 1;
    streak.history.push({ date, completed: true, count: streak.currentCount });

    if (streak.history.length > 365) {
      streak.history = streak.history.slice(-365);
    }

    await streak.save();
    return streak;
  }

  static async resetStreak(
    childId: string,
    streakType: StreakType,
  ): Promise<IStreak> {
    const streak = await Streak.findOne({ childId, streakType });
    if (!streak) throw new Error('Streak not found');

    streak.currentCount = 0;
    streak.lastCompletedDate = undefined;
    streak.history.push({
      date: new Date(),
      completed: false,
      count: 0,
    });
    await streak.save();
    return streak;
  }

  static async checkAndResetStreaks(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const activeStreaks = await Streak.find({ isActive: true });

    for (const streak of activeStreaks) {
      if (streak.lastCompletedDate) {
        const lastDate = new Date(streak.lastCompletedDate);
        const daysSinceLastCompletion = Math.floor(
          (yesterday.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysSinceLastCompletion > 1) {
          streak.currentCount = 0;
          streak.history.push({
            date: yesterday,
            completed: false,
            count: 0,
          });
          await streak.save();
        }
      }
    }
  }

  static isConsecutiveDay(lastDate?: Date, currentDate?: Date): boolean {
    if (!lastDate || !currentDate) return false;

    const last = new Date(lastDate);
    const current = new Date(currentDate);

    last.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 1;
  }

  static async getStreakStats(childId: string): Promise<{
    totalActiveStreaks: number;
    longestCurrentStreak: number;
    longestEverStreak: number;
    totalStreakDays: number;
    perfectDays: number;
  }> {
    const streaks = await Streak.find({ childId });

    const totalActiveStreaks = streaks.filter(s => s.currentCount > 0).length;
    const longestCurrentStreak = Math.max(...streaks.map(s => s.currentCount), 0);
    const longestEverStreak = Math.max(...streaks.map(s => s.longestCount), 0);
    const totalStreakDays = streaks.reduce((sum, s) => sum + s.totalCompletions, 0);

    const perfectDayStreak = streaks.find(s => s.streakType === 'perfect_day');
    const perfectDays = perfectDayStreak?.totalCompletions || 0;

    return {
      totalActiveStreaks,
      longestCurrentStreak,
      longestEverStreak,
      totalStreakDays,
      perfectDays,
    };
  }

  static async getStreakHistory(
    childId: string,
    streakType: StreakType,
    days = 30,
  ): Promise<{ date: Date; completed: boolean; count: number }[]> {
    const streak = await Streak.findOne({ childId, streakType });
    if (!streak) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return streak.history.filter(h => h.date >= cutoff);
  }
}
