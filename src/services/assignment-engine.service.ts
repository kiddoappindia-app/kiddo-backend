import { Assignment } from '../models/assignment.model.js';
import { SchoolClass } from '../models/school-class.model.js';
import { Types } from 'mongoose';

export class AssignmentEngineService {
  async createAssignment(data: any) {
    const assignment = await Assignment.create(data);
    await SchoolClass.findByIdAndUpdate(data.classId, { $inc: { totalAssignments: 1 } });
    return assignment;
  }

  async updateAssignment(assignmentId: string, data: any) {
    return Assignment.findByIdAndUpdate(assignmentId, data, { new: true });
  }

  async publishAssignment(assignmentId: string) {
    return Assignment.findByIdAndUpdate(
      assignmentId,
      { status: 'active', publishedAt: new Date() },
      { new: true },
    );
  }

  async getAssignment(assignmentId: string) {
    return Assignment.findById(assignmentId)
      .populate('classId', 'name classCode')
      .populate('subjectId', 'name code color')
      .populate('teacherId', 'firstName lastName');
  }

  async getClassAssignments(classId: string, filters?: { status?: string; subjectId?: string }) {
    const query: any = { classId };
    if (filters?.status) query.status = filters.status;
    if (filters?.subjectId) query.subjectId = filters.subjectId;
    return Assignment.find(query)
      .populate('subjectId', 'name code color icon')
      .populate('teacherId', 'firstName lastName')
      .sort({ dueDate: -1 });
  }

  async getStudentAssignments(studentId: string, filters?: { status?: string; classId?: string }) {
    const query: any = { assignedTo: studentId };
    if (filters?.status) query.status = filters.status;
    if (filters?.classId) query.classId = filters.classId;
    return Assignment.find(query)
      .populate('classId', 'name classCode')
      .populate('subjectId', 'name code color icon')
      .populate('teacherId', 'firstName lastName')
      .sort({ dueDate: -1 });
  }

  async submitAssignment(assignmentId: string, studentId: string, submission: any) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const existingSubmission = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId,
    );

    if (existingSubmission) {
      if (existingSubmission.status === 'graded') {
        throw new Error('Assignment already graded');
      }
      existingSubmission.content = submission.content;
      existingSubmission.attachments = submission.attachments;
      existingSubmission.submittedAt = new Date();
      existingSubmission.status = 'submitted';
      existingSubmission.attemptNumber += 1;
    } else {
      assignment.submissions.push({
        studentId: new Types.ObjectId(studentId),
        content: submission.content,
        attachments: submission.attachments,
        status: 'submitted',
        attemptNumber: 1,
        submittedAt: new Date(),
        grade: 0,
        feedback: '',
        gradedBy: new Types.ObjectId(),
        gradedAt: new Date(),
      });
    }

    await assignment.save();
    return assignment;
  }

  async gradeSubmission(assignmentId: string, studentId: string, grade: number, feedback: string, gradedBy: string) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId,
    );
    if (!submission) throw new Error('Submission not found');

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = new Types.ObjectId(gradedBy);
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await assignment.save();
    return assignment;
  }

  async getTeacherAssignments(teacherId: string, filters?: { classId?: string; status?: string }) {
    const query: any = { teacherId };
    if (filters?.classId) query.classId = filters.classId;
    if (filters?.status) query.status = filters.status;
    return Assignment.find(query)
      .populate('classId', 'name classCode')
      .populate('subjectId', 'name code color')
      .sort({ createdAt: -1 });
  }

  async getAssignmentStats(classId: string) {
    const assignments = await Assignment.find({ classId });
    const total = assignments.length;
    const active = assignments.filter((a) => a.status === 'active').length;
    const submitted = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const graded = assignments.reduce(
      (sum, a) => sum + a.submissions.filter((s) => s.status === 'graded').length,
      0,
    );
    return { total, active, submitted, graded };
  }

  async deleteAssignment(assignmentId: string) {
    return Assignment.findByIdAndUpdate(assignmentId, { status: 'archived' }, { new: true });
  }
}
