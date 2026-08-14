import { Request, Response } from 'express';
import { AssignmentEngineService } from '../services/assignment-engine.service.js';

const service = new AssignmentEngineService();

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await service.createAssignment({
      ...req.body,
      teacherId: req.user?.id,
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await service.updateAssignment(req.params.assignmentId as string, req.body);
    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publishAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await service.publishAssignment(req.params.assignmentId as string);
    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await service.getAssignment(req.params.assignmentId as string);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await service.getClassAssignments(req.params.classId as string, req.query as any);
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAssignments = async (req: Request, res: Response) => {
  try {
    const studentId = (req.params.studentId as string) || (req.user?.id as string);
    const assignments = await service.getStudentAssignments(studentId, req.query as any);
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const studentId = req.user?.id as string;
    const assignment = await service.submitAssignment(req.params.assignmentId as string, studentId, req.body);
    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { grade, feedback } = req.body;
    const assignment = await service.gradeSubmission(
      req.params.assignmentId as string,
      req.params.studentId as string,
      grade,
      feedback,
      req.user?.id as string,
    );
    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await service.getTeacherAssignments(req.user?.id as string, req.query as any);
    res.json({ success: true, data: assignments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignmentStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getAssignmentStats(req.params.classId as string);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await service.deleteAssignment(req.params.assignmentId as string);
    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
