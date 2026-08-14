import { SchoolReward } from '../models/school-reward.model.js';
import { User } from '../models/user.model.js';
import { Types } from 'mongoose';

export class SchoolRewardEngineService {
  async awardStars(teacherId: string, studentId: string, data: any) {
    const reward = await SchoolReward.create({
      teacherId,
      studentId,
      type: 'stars',
      stars: data.stars,
      title: data.title,
      description: data.description || '',
      schoolId: data.schoolId,
      classId: data.classId,
      metadata: { subjectId: data.subjectId, assignmentId: data.assignmentId, category: data.category },
    });

    await User.findByIdAndUpdate(studentId, { $inc: { points: data.stars } });
    return reward;
  }

  async awardCertificate(teacherId: string, studentId: string, data: any) {
    return SchoolReward.create({
      teacherId,
      studentId,
      type: 'certificate',
      title: data.title,
      description: data.description || '',
      schoolId: data.schoolId,
      classId: data.classId,
      metadata: { category: data.category },
    });
  }

  async awardBadge(teacherId: string, studentId: string, data: any) {
    return SchoolReward.create({
      teacherId,
      studentId,
      type: 'badge',
      title: data.title,
      description: data.description || '',
      schoolId: data.schoolId,
      classId: data.classId,
    });
  }

  async awardRecognition(teacherId: string, studentId: string, data: any) {
    return SchoolReward.create({
      teacherId,
      studentId,
      type: 'recognition',
      title: data.title,
      description: data.description || '',
      schoolId: data.schoolId,
      classId: data.classId,
    });
  }

  async awardParticipation(teacherId: string, studentId: string, data: any) {
    return SchoolReward.create({
      teacherId,
      studentId,
      type: 'participation',
      stars: data.stars || 1,
      title: data.title,
      description: data.description || '',
      schoolId: data.schoolId,
      classId: data.classId,
    });
  }

  async getStudentRewards(studentId: string, filters?: { type?: string; classId?: string }) {
    const query: any = { studentId };
    if (filters?.type) query.type = filters.type;
    if (filters?.classId) query.classId = filters.classId;
    return SchoolReward.find(query)
      .populate('teacherId', 'firstName lastName')
      .sort({ awardedAt: -1 });
  }

  async getTeacherAwards(teacherId: string) {
    return SchoolReward.find({ teacherId })
      .populate('studentId', 'firstName lastName avatar')
      .sort({ awardedAt: -1 });
  }

  async getPendingConversions(studentId: string) {
    return SchoolReward.find({
      studentId,
      parentApprovalRequired: true,
      parentApproved: false,
      type: { $in: ['stars', 'certificate', 'badge'] },
    }).populate('teacherId', 'firstName lastName');
  }

  async approveConversion(rewardId: string, conversionType: 'coins' | 'xp' | 'achievement' | 'none') {
    const reward = await SchoolReward.findByIdAndUpdate(
      rewardId,
      {
        parentApproved: true,
        parentApprovedAt: new Date(),
        parentConverted: true,
        convertedAt: new Date(),
        conversionType,
      },
      { new: true },
    );

    if (reward && conversionType !== 'none') {
      const user = await User.findById(reward.studentId);
      if (user) {
        if (conversionType === 'coins') {
          await User.findByIdAndUpdate(reward.studentId, { $inc: { points: reward.stars * 10 } });
        } else if (conversionType === 'xp') {
          await User.findByIdAndUpdate(reward.studentId, { $inc: { xp: reward.stars * 5 } });
        }
      }
    }

    return reward;
  }

  async getSchoolRewardStats(schoolId: string) {
    const [totalAwards, byType, byTeacher] = await Promise.all([
      SchoolReward.countDocuments({ schoolId }),
      SchoolReward.aggregate([
        { $match: { schoolId: new Types.ObjectId(schoolId) } },
        { $group: { _id: '$type', count: { $sum: 1 }, totalStars: { $sum: '$stars' } } },
      ]),
      SchoolReward.aggregate([
        { $match: { schoolId: new Types.ObjectId(schoolId) } },
        { $group: { _id: '$teacherId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return { totalAwards, byType, topTeachers: byTeacher };
  }
}
