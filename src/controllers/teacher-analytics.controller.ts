import { Request, Response } from 'express';
import { TeacherAnalyticsService } from '../services/teacher-analytics.service.js';

const service = new TeacherAnalyticsService();

export const getTeacherDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await service.getTeacherDashboard(req.user?.id as string);
    res.json({ success: true, data: dashboard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await service.getClassAnalytics(req.params.classId as string);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentProgress = async (req: Request, res: Response) => {
  try {
    const progress = await service.getStudentProgress(req.params.studentId as string, req.query.classId as string);
    res.json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHomeworkCompletionRate = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await service.getHomeworkCompletionRate(
      req.params.classId as string,
      new Date(startDate as string),
      new Date(endDate as string),
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getParentEngagement = async (req: Request, res: Response) => {
  try {
    const engagement = await service.getParentEngagement(req.user?.id as string);
    res.json({ success: true, data: engagement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
