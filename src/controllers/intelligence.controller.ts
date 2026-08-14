import { Request, Response } from 'express';
import { EventEngineService } from '../services/event-engine.service.js';
import { GrowthEngineService } from '../services/growth-engine.service.js';
import { HabitEngineService } from '../services/habit-engine.service.js';
import { InsightEngineService } from '../services/insight-engine.service.js';
import { TrendEngineService } from '../services/trend-engine.service.js';
import { ReportEngineService } from '../services/report-engine.service.js';
import { AnalyticsAggregatorService } from '../services/analytics-aggregator.service.js';

const eventEngine = new EventEngineService();
const growthEngine = new GrowthEngineService();
const habitEngine = new HabitEngineService();
const insightEngine = new InsightEngineService();
const trendEngine = new TrendEngineService();
const reportEngine = new ReportEngineService();
const aggregator = new AnalyticsAggregatorService();

// Helper to get authenticated user ID as string
const getUserId = (req: Request): string => req.user?.id as string;

// Helper to get path parameter as string
const getParam = (param: any): string => (param as string) || '';

// ─── Events ──────────────────────────────────────────────────────────
export const trackEvent = async (req: Request, res: Response) => {
  try {
    const event = await eventEngine.trackEvent({ ...req.body, userId: getUserId(req) });
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await eventEngine.getEvents(getUserId(req), req.query as any);
    res.json({ success: true, data: events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEventCounts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const counts = await eventEngine.getEventCounts(
      getUserId(req),
      new Date(startDate as string),
      new Date(endDate as string),
    );
    res.json({ success: true, data: counts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTimeline = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const timeline = await eventEngine.getTimeline(getUserId(req), days);
    res.json({ success: true, data: timeline });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Growth ──────────────────────────────────────────────────────────
export const getGrowthProfile = async (req: Request, res: Response) => {
  try {
    const userId = getParam(req.params.userId) || getUserId(req);
    const profile = await growthEngine.getGrowthProfile(userId);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGrowthTimeline = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const timeline = await growthEngine.getGrowthTimeline(getUserId(req), months);
    res.json({ success: true, data: timeline });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDimensionTrend = async (req: Request, res: Response) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 8;
    const trend = await growthEngine.getDimensionTrend(
      getParam(req.params.dimension),
      getParam(req.params.userId) || getUserId(req),
      weeks
    );
    res.json({ success: true, data: trend });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Habits ──────────────────────────────────────────────────────────
export const analyzeHabits = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'weekly';
    const habits = await habitEngine.analyzeAllHabits(getUserId(req), period as any);
    res.json({ success: true, data: habits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHabitTrends = async (req: Request, res: Response) => {
  try {
    const periods = parseInt(req.query.periods as string) || 12;
    const trends = await habitEngine.getHabitTrends(getParam(req.params.habitType), getUserId(req), periods);
    res.json({ success: true, data: trends });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmergingHabits = async (req: Request, res: Response) => {
  try {
    const habits = await habitEngine.detectEmergingHabits(getUserId(req));
    res.json({ success: true, data: habits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDecliningHabits = async (req: Request, res: Response) => {
  try {
    const habits = await habitEngine.detectDecliningHabits(getUserId(req));
    res.json({ success: true, data: habits });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Insights ────────────────────────────────────────────────────────
export const getInsights = async (req: Request, res: Response) => {
  try {
    const insights = await insightEngine.getInsights(getUserId(req), req.query as any);
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acknowledgeInsight = async (req: Request, res: Response) => {
  try {
    const insight = await insightEngine.acknowledgeInsight(getParam(req.params.insightId));
    res.json({ success: true, data: insight });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const evaluateRules = async (req: Request, res: Response) => {
  try {
    const insights = await insightEngine.evaluateRules(getUserId(req));
    res.json({ success: true, data: insights });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Trends ──────────────────────────────────────────────────────────
export const getTaskTrend = async (req: Request, res: Response) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const trend = await trendEngine.getTaskCompletionTrend(getUserId(req), weeks);
    res.json({ success: true, data: trend });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHomeworkTrend = async (req: Request, res: Response) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const trend = await trendEngine.getHomeworkTrend(getUserId(req), weeks);
    res.json({ success: true, data: trend });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceTrend = async (req: Request, res: Response) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const trend = await trendEngine.getAttendanceTrend(getUserId(req), weeks);
    res.json({ success: true, data: trend });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReadingTrend = async (req: Request, res: Response) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const trend = await trendEngine.getReadingTrend(getUserId(req), weeks);
    res.json({ success: true, data: trend });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Reports ─────────────────────────────────────────────────────────
export const generateParentWeeklyReport = async (req: Request, res: Response) => {
  try {
    const { weekStart } = req.body;
    const report = await reportEngine.generateParentWeeklyReport(
      getParam(req.params.userId) || getUserId(req),
      new Date(weekStart)
    );
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await reportEngine.getReports(getUserId(req), req.query.type as string);
    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReport = async (req: Request, res: Response) => {
  try {
    const report = await reportEngine.getReport(getParam(req.params.reportId));
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Summaries ───────────────────────────────────────────────────────
export const getDailySummaries = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const summaries = await aggregator.getDailySummaries(getUserId(req), days);
    res.json({ success: true, data: summaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWeeklySummaries = async (req: Request, res: Response) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const summaries = await aggregator.getWeeklySummaries(getUserId(req), weeks);
    res.json({ success: true, data: summaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlySummaries = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const summaries = await aggregator.getMonthlySummaries(getUserId(req), months);
    res.json({ success: true, data: summaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
