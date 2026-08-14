import { Request, Response } from 'express';
import { AnnouncementEngineService } from '../services/announcement-engine.service.js';

const service = new AnnouncementEngineService();

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await service.createAnnouncement({
      ...req.body,
      teacherId: req.user?.id,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await service.updateAnnouncement(req.params.announcementId as string, req.body);
    res.json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publishAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await service.publishAnnouncement(req.params.announcementId as string);
    res.json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await service.getAnnouncements(req.params.schoolId as string, req.query as any);
    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await service.getTeacherAnnouncements(req.user?.id as string);
    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAnnouncements = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id as string;
    const announcements = await service.getStudentAnnouncements(studentId, req.query.classId as string);
    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getParentAnnouncements = async (req: Request, res: Response) => {
  try {
    const parentId = req.user?.id as string;
    const classIds = req.query.classIds as string[];
    const announcements = await service.getParentAnnouncements(parentId, classIds);
    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const acknowledgeAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await service.acknowledgeAnnouncement(req.params.announcementId as string, req.user?.id as string);
    res.json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    await service.deleteAnnouncement(req.params.announcementId as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
