import { Types } from 'mongoose';
import { School } from '../models/school.model.js';
import { AcademicYear } from '../models/academic-year.model.js';
import { Grade } from '../models/grade.model.js';
import { Section } from '../models/section.model.js';
import { Subject } from '../models/subject.model.js';
import { SchoolClass } from '../models/school-class.model.js';
import { User } from '../models/user.model.js';

export class SchoolStructureService {
  async createSchool(data: any) {
    const school = await School.create(data);
    return school;
  }

  async getSchool(schoolId: string) {
    return School.findById(schoolId);
  }

  async updateSchool(schoolId: string, data: any) {
    return School.findByIdAndUpdate(schoolId, data, { new: true });
  }

  async createAcademicYear(schoolId: string, data: any) {
    return AcademicYear.create({ ...data, schoolId });
  }

  async getActiveAcademicYear(schoolId: string) {
    return AcademicYear.findOne({ schoolId, status: 'active' });
  }

  async createGrade(schoolId: string, academicYearId: string, data: any) {
    return Grade.create({ ...data, schoolId, academicYearId });
  }

  async getGrades(schoolId: string) {
    return Grade.find({ schoolId }).populate('sections');
  }

  async createSection(schoolId: string, gradeId: string, data: any) {
    const section = await Section.create({ ...data, schoolId, gradeId });
    await Grade.findByIdAndUpdate(gradeId, { $push: { sections: section._id } });
    return section;
  }

  async getSections(gradeId: string) {
    return Section.find({ gradeId }).populate('classTeacherId', 'firstName lastName');
  }

  async createSubject(schoolId: string, data: any) {
    return Subject.create({ ...data, schoolId });
  }

  async getSubjects(schoolId: string) {
    return Subject.find({ schoolId, isActive: true });
  }

  async createClass(data: any) {
    return SchoolClass.create(data);
  }

  async getTeacherClasses(teacherId: string) {
    return SchoolClass.find({ teacherIds: teacherId, status: 'active' })
      .populate('gradeId', 'name level')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code color icon');
  }

  async getClassStudents(classId: string) {
    const cls = await SchoolClass.findById(classId).populate('studentIds', 'firstName lastName avatar');
    return cls?.studentIds || [];
  }

  async addStudentToClass(classId: string, studentId: string) {
    const cls = await SchoolClass.findByIdAndUpdate(
      classId,
      { $addToSet: { studentIds: studentId } },
      { new: true },
    );
    await User.findByIdAndUpdate(studentId, { classId });
    return cls;
  }

  async removeStudentFromClass(classId: string, studentId: string) {
    const cls = await SchoolClass.findByIdAndUpdate(
      classId,
      { $pull: { studentIds: studentId } },
      { new: true },
    );
    await User.findByIdAndUpdate(studentId, { $unset: { classId: 1 } });
    return cls;
  }

  async assignTeacherToClass(classId: string, teacherId: string) {
    return SchoolClass.findByIdAndUpdate(
      classId,
      { $addToSet: { teacherIds: teacherId } },
      { new: true },
    );
  }

  async getSchoolStats(schoolId: string) {
    const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
      User.countDocuments({ role: 'child' }),
      User.countDocuments({ role: 'teacher' }),
      SchoolClass.countDocuments({ schoolId, status: 'active' }),
    ]);
    return { totalStudents, totalTeachers, totalClasses };
  }
}
