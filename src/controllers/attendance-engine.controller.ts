import { Request, Response } from 'express';
import { AttendanceEngineService } from '../services/attendance-engine.service.js';

const service = new AttendanceEngineService();

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date, records } = req.body;
    const attendance = await service.markAttendance(classId, req.user?.id as string, new Date(date), records);
    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const finalizeAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.body;
    const attendance = await service.finalizeAttendance(classId, new Date(date));
    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, date } = req.query;
    const attendance = await service.getAttendance(classId as string, new Date(date as string));
    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const records = await service.getStudentAttendance(
      req.params.studentId as string,
      new Date(startDate as string),
      new Date(endDate as string),
    );
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await service.getAttendanceStats(
      req.params.classId as string,
      new Date(startDate as string),
      new Date(endDate as string),
    );
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const history = await service.getStudentAttendanceHistory(req.params.studentId as string, months);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
