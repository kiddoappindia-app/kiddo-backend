import { GrowthProfile } from '../models/growth-profile.model.js';
import { IntelligenceEvent } from '../models/intelligence-event.model.js';
import { Types } from 'mongoose';

const DIMENSION_WEIGHTS: Record<string, Record<string, number>> = {
  task_completed: { responsibility: 3, consistency: 2 },
  task_approved: { responsibility: 2, consistency: 1 },
  task_missed: { responsibility: -2, consistency: -1 },
  homework_submitted: { learning: 3, responsibility: 2, focus: 1 },
  homework_graded: { learning: 2 },
  homework_late: { responsibility: -1, focus: -1 },
  homework_missed: { responsibility: -3, consistency: -2 },
  attendance_present: { consistency: 2, responsibility: 1 },
  attendance_late: { consistency: -1 },
  attendance_absent: { consistency: -2 },
  reading_session: { reading: 3, focus: 2, learning: 1 },
  exercise_completed: { fitness: 3, health: 2 },
  fitness_session: { fitness: 2, health: 2, consistency: 1 },
  reward_earned: { kindness: 1 },
  achievement_unlocked: { creativity: 1, focus: 1 },
  streak_milestone: { consistency: 3 },
  parent_approval: { responsibility: 1 },
  teacher_feedback: { learning: 1 },
  daily_gift_claimed: { consistency: 1 },
  mission_completed: { focus: 2, responsibility: 1 },
  challenge_completed: { creativity: 1, focus: 1 },
  pet_interaction: { kindness: 2, health: 1 },
  world_travel: { creativity: 1, learning: 1 },
  avatar_level_up: { consistency: 1 },
};

const DIMENSION_NAMES = [
  'responsibility', 'reading', 'learning', 'fitness', 'health',
  'kindness', 'creativity', 'focus', 'independence', 'consistency',
];

export class GrowthEngineService {
  async getOrCreateProfile(userId: string) {
    let profile = await GrowthProfile.findOne({ userId });
    if (!profile) {
      profile = await GrowthProfile.create({
        userId: new Types.ObjectId(userId),
        dimensions: Object.fromEntries(
          DIMENSION_NAMES.map((name) => [name, { name, score: 0, previousScore: 0, trend: 'new' }]),
        ),
      });
    }
    return profile;
  }

  async processEvent(event: any) {
    const profile = await this.getOrCreateProfile(event.userId);
    const weights = DIMENSION_WEIGHTS[event.type] || {};

    let totalChange = 0;
    const dimensionChanges: Record<string, number> = {};

    for (const [dimension, weight] of Object.entries(weights)) {
      const dims = profile.dimensions as any;
      if (dims[dimension]) {
        const dim = dims[dimension];
        const oldScore = dim.score;
        const change = weight * (event.metadata?.difficulty === 'hard' ? 1.5 : event.metadata?.difficulty === 'easy' ? 0.5 : 1);
        dim.score = Math.max(0, Math.min(100, dim.score + change));
        dim.eventsCount += 1;
        dim.lastActivityAt = new Date();
        dim.previousScore = oldScore;

        // Update trend
        if (dim.score > oldScore + 2) dim.trend = 'improving';
        else if (dim.score < oldScore - 2) dim.trend = 'declining';
        else if (dim.eventsCount > 1) dim.trend = 'stable';

        // Add to history (keep last 90 entries)
        dim.history.push({ date: new Date(), score: dim.score });
        if (dim.history.length > 90) dim.history = dim.history.slice(-90);

        totalChange += change;
        dimensionChanges[dimension] = change;
      }
    }

    // Update overall score
    const oldOverall = profile.overallScore;
    const dimsAny = profile.dimensions as any;
    const dimensionScores = DIMENSION_NAMES.map(
      (name) => dimsAny[name]?.score || 0,
    );
    profile.overallScore = Math.round(dimensionScores.reduce((a, b) => a + b, 0) / dimensionScores.length);
    profile.totalEvents += 1;
    profile.lastCalculatedAt = new Date();

    if (profile.overallScore > oldOverall + 2) profile.overallTrend = 'improving';
    else if (profile.overallScore < oldOverall - 2) profile.overallTrend = 'declining';
    else profile.overallTrend = 'stable';

    // Update level
    profile.level = Math.floor(profile.overallScore / 10) + 1;

    // Check milestones
    await this.checkMilestones(profile, event);

    await profile.save();
    return { profile, dimensionChanges };
  }

  async checkMilestones(profile: any, event: any) {
    const existingTypes = new Set(profile.milestones.map((m: any) => m.type));

    const milestoneChecks = [
      { type: 'first_task', condition: profile.totalEvents >= 1, title: 'First Step', description: 'Completed first activity' },
      { type: '100_events', condition: profile.totalEvents >= 100, title: 'Century Club', description: '100 activities completed' },
      { type: '500_events', condition: profile.totalEvents >= 500, title: 'Activity Champion', description: '500 activities completed' },
      { type: 'responsibility_50', condition: profile.dimensions.responsibility?.score >= 50, title: 'Responsible Star', description: 'Responsibility score reached 50' },
      { type: 'reading_50', condition: profile.dimensions.reading?.score >= 50, title: 'Reading Star', description: 'Reading score reached 50' },
      { type: 'fitness_50', condition: profile.dimensions.fitness?.score >= 50, title: 'Fitness Star', description: 'Fitness score reached 50' },
      { type: 'consistency_75', condition: profile.dimensions.consistency?.score >= 75, title: 'Consistency Master', description: 'Consistency score reached 75' },
      { type: 'overall_75', condition: profile.overallScore >= 75, title: 'Well Rounded', description: 'Overall score reached 75' },
      { type: 'overall_90', condition: profile.overallScore >= 90, title: 'Excellence', description: 'Overall score reached 90' },
    ];

    for (const check of milestoneChecks) {
      if (check.condition && !existingTypes.has(check.type)) {
        profile.milestones.push({
          type: check.type,
          title: check.title,
          description: check.description,
          achievedAt: new Date(),
        });
      }
    }
  }

  async getGrowthProfile(userId: string) {
    return this.getOrCreateProfile(userId);
  }

  async getGrowthTimeline(userId: string, months: number = 6) {
    const profile = await this.getOrCreateProfile(userId);
    return profile.weeklySnapshots.slice(-months * 4);
  }

  async getDimensionTrend(userId: string, dimension: string, weeks: number = 8) {
    const profile = await this.getOrCreateProfile(userId);
    const dim = (profile.dimensions as any)?.[dimension];
    if (!dim) return [];
    return dim.history.slice(-weeks);
  }

  async comparePeriods(userId: string, startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date) {
    const [currentEvents, prevEvents] = await Promise.all([
      IntelligenceEvent.countDocuments({
        userId: new Types.ObjectId(userId),
        timestamp: { $gte: startDate, $lte: endDate },
      }),
      IntelligenceEvent.countDocuments({
        userId: new Types.ObjectId(userId),
        timestamp: { $gte: prevStartDate, $lte: prevEndDate },
      }),
    ]);

    return {
      current: currentEvents,
      previous: prevEvents,
      change: prevEvents > 0 ? ((currentEvents - prevEvents) / prevEvents) * 100 : 0,
    };
  }
}
