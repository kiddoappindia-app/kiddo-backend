import { Request, Response } from 'express';
import { SchoolRewardEngineService } from '../services/school-reward-engine.service.js';

const service = new SchoolRewardEngineService();

export const awardStars = async (req: Request, res: Response) => {
  try {
    const reward = await service.awardStars(req.user?.id as string, req.body.studentId, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const awardCertificate = async (req: Request, res: Response) => {
  try {
    const reward = await service.awardCertificate(req.user?.id as string, req.body.studentId, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const awardBadge = async (req: Request, res: Response) => {
  try {
    const reward = await service.awardBadge(req.user?.id as string, req.body.studentId, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const awardRecognition = async (req: Request, res: Response) => {
  try {
    const reward = await service.awardRecognition(req.user?.id as string, req.body.studentId, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const awardParticipation = async (req: Request, res: Response) => {
  try {
    const reward = await service.awardParticipation(req.user?.id as string, req.body.studentId, req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStudentRewards = async (req: Request, res: Response) => {
  try {
    const rewards = await service.getStudentRewards(req.params.studentId as string, req.query as any);
    res.json({ success: true, data: rewards });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherAwards = async (req: Request, res: Response) => {
  try {
    const awards = await service.getTeacherAwards(req.user?.id as string);
    res.json({ success: true, data: awards });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingConversions = async (req: Request, res: Response) => {
  try {
    const rewards = await service.getPendingConversions(req.params.studentId as string);
    res.json({ success: true, data: rewards });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveConversion = async (req: Request, res: Response) => {
  try {
    const reward = await service.approveConversion(req.params.rewardId as string, req.body.conversionType);
    res.json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSchoolRewardStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getSchoolRewardStats(req.params.schoolId as string);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
