import { Attendance } from '../models/attendance.model.js';
import { SchoolClass } from '../models/school-class.model.js';
import { Types } from 'mongoose';

export class AttendanceEngineService {
  async markAttendance(classId: string, teacherId: string, date: Date, records: any[]) {
    const existing = await Attendance.findOne({ classId, date: this._startOfDay(date) });
    if (existing && existing.status === 'finalized') {
      throw new Error('Attendance already finalized');
    }

    const totals = { present: 0, late: 0, absent: 0, excused: 0 };
    records.forEach((r) => {
      totals[r.status as keyof typeof totals]++;
    });

    if (existing) {
      existing.records = records.map((r) => ({
        ...r,
        studentId: new Types.ObjectId(r.studentId),
        markedBy: new Types.ObjectId(teacherId),
        markedAt: new Date(),
      })) as any;
      existing.totalPresent = totals.present;
      existing.totalLate = totals.late;
      existing.totalAbsent = totals.absent;
      existing.totalExcused = totals.excused;
      return existing.save();
    }

    return Attendance.create({
      schoolId: (await SchoolClass.findById(classId))?.schoolId,
      classId: new Types.ObjectId(classId),
      teacherId: new Types.ObjectId(teacherId),
      date: this._startOfDay(date),
      records: records.map((r) => ({
        ...r,
        studentId: new Types.ObjectId(r.studentId),
        markedBy: new Types.ObjectId(teacherId),
        markedAt: new Date(),
      })),
      totalPresent: totals.present,
      totalLate: totals.late,
      totalAbsent: totals.absent,
      totalExcused: totals.excused,
    });
  }

  async finalizeAttendance(classId: string, date: Date) {
    return Attendance.findOneAndUpdate(
      { classId, date: this._startOfDay(date) },
      { status: 'finalized', finalizedAt: new Date() },
      { new: true },
    );
  }

  async getAttendance(classId: string, date: Date) {
    return Attendance.findOne({ classId, date: this._startOfDay(date) })
      .populate('records.studentId', 'firstName lastName avatar');
  }

  async getStudentAttendance(studentId: string, startDate: Date, endDate: Date) {
    return Attendance.find({
      'records.studentId': studentId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });
  }

  async getAttendanceStats(classId: string, startDate: Date, endDate: Date) {
    const records = await Attendance.find({
      classId,
      date: { $gte: startDate, $lte: endDate },
      status: 'finalized',
    });

    const stats = {
      totalDays: records.length,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      attendanceRate: 0,
    };

    records.forEach((r) => {
      stats.present += r.totalPresent;
      stats.late += r.totalLate;
      stats.absent += r.totalAbsent;
      stats.excused += r.totalExcused;
    });

    const totalPossible = stats.present + stats.late + stats.absent + stats.excused;
    stats.attendanceRate = totalPossible > 0 ? (stats.present / totalPossible) * 100 : 0;

    return stats;
  }

  async getStudentAttendanceHistory(studentId: string, months: number = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const records = await Attendance.find({
      'records.studentId': studentId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    return records.map((r) => {
      const record = r.records.find(
        (rec) => rec.studentId.toString() === studentId,
      );
      return {
        date: r.date,
        status: record?.status || 'absent',
        minutesLate: record?.minutesLate || 0,
      };
    });
  }

  private _startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
