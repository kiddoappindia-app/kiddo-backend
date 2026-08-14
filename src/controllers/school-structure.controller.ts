import { Request, Response } from 'express';
import { SchoolStructureService } from '../services/school-structure.service.js';

const service = new SchoolStructureService();

export const createSchool = async (req: Request, res: Response) => {
  try {
    const school = await service.createSchool({ ...req.body, createdBy: req.user?.id as string });
    res.status(201).json({ success: true, data: school });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSchool = async (req: Request, res: Response) => {
  try {
    const school = await service.getSchool(req.params.schoolId as string);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  try {
    const school = await service.updateSchool(req.params.schoolId as string, req.body);
    res.json({ success: true, data: school });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const year = await service.createAcademicYear(req.params.schoolId as string, req.body);
    res.status(201).json({ success: true, data: year });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getActiveAcademicYear = async (req: Request, res: Response) => {
  try {
    const year = await service.getActiveAcademicYear(req.params.schoolId as string);
    res.json({ success: true, data: year });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGrade = async (req: Request, res: Response) => {
  try {
    const grade = await service.createGrade(req.params.schoolId as string, req.body.academicYearId, req.body);
    res.status(201).json({ success: true, data: grade });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getGrades = async (req: Request, res: Response) => {
  try {
    const grades = await service.getGrades(req.params.schoolId as string);
    res.json({ success: true, data: grades });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSection = async (req: Request, res: Response) => {
  try {
    const section = await service.createSection(req.params.schoolId as string, req.params.gradeId as string, req.body);
    res.status(201).json({ success: true, data: section });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSections = async (req: Request, res: Response) => {
  try {
    const sections = await service.getSections(req.params.gradeId as string);
    res.json({ success: true, data: sections });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = await service.createSubject(req.params.schoolId as string, req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await service.getSubjects(req.params.schoolId as string);
    res.json({ success: true, data: subjects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const cls = await service.createClass(req.body);
    res.status(201).json({ success: true, data: cls });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTeacherClasses = async (req: Request, res: Response) => {
  try {
    const classes = await service.getTeacherClasses(req.user?.id as string);
    res.json({ success: true, data: classes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassStudents = async (req: Request, res: Response) => {
  try {
    const students = await service.getClassStudents(req.params.classId as string);
    res.json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addStudentToClass = async (req: Request, res: Response) => {
  try {
    const cls = await service.addStudentToClass(req.params.classId as string, req.body.studentId);
    res.json({ success: true, data: cls });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeStudentFromClass = async (req: Request, res: Response) => {
  try {
    const cls = await service.removeStudentFromClass(req.params.classId as string, req.params.childId as string);
    res.json({ success: true, data: cls });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const assignTeacherToClass = async (req: Request, res: Response) => {
  try {
    const cls = await service.assignTeacherToClass(req.params.classId as string, req.body.teacherId);
    res.json({ success: true, data: cls });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSchoolStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getSchoolStats(req.params.schoolId as string);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
