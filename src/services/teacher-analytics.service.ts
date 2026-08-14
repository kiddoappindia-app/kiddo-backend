import { Assignment } from '../models/assignment.model.js';
import { Attendance } from '../models/attendance.model.js';
import { SchoolClass } from '../models/school-class.model.js';
import { SchoolReward } from '../models/school-reward.model.js';
import { Announcement } from '../models/announcement.model.js';
import { User } from '../models/user.model.js';
import { Types } from 'mongoose';

export class TeacherAnalyticsService {
  async getTeacherDashboard(teacherId: string) {
    const classes = await SchoolClass.find({ teacherIds: teacherId, status: 'active' });
    const classIds = classes.map((c) => c._id);

    const [assignments, recentSubmissions, attendanceSummary, rewardCount] = await Promise.all([
      Assignment.countDocuments({ teacherId }),
      Assignment.aggregate([
        { $match: { teacherId: new Types.ObjectId(teacherId) } },
        { $unwind: '$submissions' },
        { $match: { 'submissions.status': 'submitted' } },
        { $count: 'total' },
      ]),
      Attendance.aggregate([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: '$date', present: { $sum: '$totalPresent' }, absent: { $sum: '$totalAbsent' } } },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      SchoolReward.countDocuments({ teacherId }),
    ]);

    return {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0),
      totalAssignments: assignments,
      pendingSubmissions: recentSubmissions[0]?.total || 0,
      totalAwards: rewardCount,
      attendanceTrend: attendanceSummary,
      classes: classes.map((c) => ({
        id: c._id,
        name: c.name,
        studentCount: c.studentIds?.length || 0,
      })),
    };
  }

  async getClassAnalytics(classId: string) {
    const [assignmentStats, attendanceStats, rewardStats] = await Promise.all([
      Assignment.aggregate([
        { $match: { classId: new Types.ObjectId(classId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: { classId: new Types.ObjectId(classId) } },
        {
          $group: {
            _id: null,
            totalPresent: { $sum: '$totalPresent' },
            totalLate: { $sum: '$totalLate' },
            totalAbsent: { $sum: '$totalAbsent' },
            totalExcused: { $sum: '$totalExcused' },
          },
        },
      ]),
      SchoolReward.aggregate([
        { $match: { classId: new Types.ObjectId(classId) } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalStars: { $sum: '$stars' },
          },
        },
      ]),
    ]);

    return { assignmentStats, attendanceStats: attendanceStats[0], rewardStats };
  }

  async getStudentProgress(studentId: string, classId?: string) {
    const query: any = { 'submissions.studentId': new Types.ObjectId(studentId) };
    if (classId) query.classId = new Types.ObjectId(classId);

    const [assignments, attendance, rewards] = await Promise.all([
      Assignment.aggregate([
        { $match: query },
        { $unwind: '$submissions' },
        { $match: { 'submissions.studentId': new Types.ObjectId(studentId) } },
        {
          $project: {
            title: 1,
            subjectId: 1,
            dueDate: 1,
            submission: '$submissions',
          },
        },
        { $sort: { dueDate: -1 } },
      ]),
      Attendance.aggregate([
        { $match: { 'records.studentId': new Types.ObjectId(studentId) } },
        { $unwind: '$records' },
        { $match: { 'records.studentId': new Types.ObjectId(studentId) } },
        {
          $group: {
            _id: '$records.status',
            count: { $sum: 1 },
          },
        },
      ]),
      SchoolReward.find({ studentId }).countDocuments(),
    ]);

    const totalSubmissions = assignments.length;
    const gradedSubmissions = assignments.filter((a) => a.submission.status === 'graded').length;
    const avgGrade = gradedSubmissions > 0
      ? assignments
          .filter((a) => a.submission.status === 'graded')
          .reduce((sum, a) => sum + (a.submission.grade || 0), 0) / gradedSubmissions
      : 0;

    return {
      totalAssignments: totalSubmissions,
      gradedAssignments: gradedSubmissions,
      averageGrade: Math.round(avgGrade),
      attendance: attendance.reduce((acc, a) => ({ ...acc, [a._id]: a.count }), {}),
      totalRewards: rewards,
    };
  }

  async getHomeworkCompletionRate(classId: string, startDate: Date, endDate: Date) {
    const assignments = await Assignment.find({
      classId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    let totalExpected = 0;
    let totalSubmitted = 0;

    assignments.forEach((a) => {
      const studentCount = a.assignedToAll ? 0 : a.assignedTo.length;
      totalExpected += studentCount;
      totalSubmitted += a.submissions.filter((s) => s.status === 'submitted' || s.status === 'graded').length;
    });

    return {
      totalAssignments: assignments.length,
      completionRate: totalExpected > 0 ? (totalSubmitted / totalExpected) * 100 : 0,
      totalExpected,
      totalSubmitted,
    };
  }

  async getParentEngagement(parentId: string) {
    const children = await User.find({ parentId });
    const childIds = children.map((c) => c._id);

    const [messages, acknowledgements, rewardApprovals] = await Promise.all([
      // Messages received from teachers
      (await import('../models/message.model.js')).Message.countDocuments({
        receiverId: parentId,
        senderId: { $in: await this._getTeacherIds(childIds) },
      }),
      // Announcements acknowledged
      (await import('../models/announcement.model.js')).Announcement.countDocuments({
        'acknowledgements.userId': parentId,
      }),
      // Pending reward approvals
      SchoolReward.countDocuments({
        studentId: { $in: childIds },
        parentApprovalRequired: true,
        parentApproved: false,
      }),
    ]);

    return { messages, acknowledgements, pendingRewardApprovals: rewardApprovals };
  }

  private async _getTeacherIds(childIds: Types.ObjectId[]): Promise<Types.ObjectId[]> {
    const classes = await SchoolClass.find({ studentIds: { $in: childIds } });
    const teacherIds = new Set<string>();
    classes.forEach((c) => c.teacherIds.forEach((t) => teacherIds.add(t.toString())));
    return Array.from(teacherIds).map((id) => new Types.ObjectId(id));
  }
}
