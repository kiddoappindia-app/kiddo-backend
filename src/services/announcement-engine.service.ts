import { Announcement } from '../models/announcement.model.js';
import { Types } from 'mongoose';

export class AnnouncementEngineService {
  async createAnnouncement(data: any) {
    return Announcement.create(data);
  }

  async updateAnnouncement(announcementId: string, data: any) {
    return Announcement.findByIdAndUpdate(announcementId, data, { new: true });
  }

  async publishAnnouncement(announcementId: string) {
    return Announcement.findByIdAndUpdate(
      announcementId,
      { isPublished: true, publishAt: new Date() },
      { new: true },
    );
  }

  async getAnnouncements(schoolId: string, filters?: { classId?: string; type?: string }) {
    const query: any = { schoolId, isPublished: true };
    if (filters?.classId) query.classId = filters.classId;
    if (filters?.type) query.type = filters.type;
    return Announcement.find(query)
      .populate('teacherId', 'firstName lastName')
      .sort({ publishAt: -1 });
  }

  async getTeacherAnnouncements(teacherId: string) {
    return Announcement.find({ teacherId })
      .populate('classId', 'name classCode')
      .sort({ createdAt: -1 });
  }

  async getStudentAnnouncements(studentId: string, classId?: string) {
    const query: any = {
      isPublished: true,
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'students' },
      ],
    };
    if (classId) {
      query.$or.push({ classId: new Types.ObjectId(classId) });
    }
    return Announcement.find(query).sort({ publishAt: -1 });
  }

  async getParentAnnouncements(parentId: string, childrenClassIds: string[]) {
    return Announcement.find({
      isPublished: true,
      classId: { $in: childrenClassIds.map((id) => new Types.ObjectId(id)) },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: 'parents' },
      ],
    })
      .populate('teacherId', 'firstName lastName')
      .sort({ publishAt: -1 });
  }

  async acknowledgeAnnouncement(announcementId: string, userId: string) {
    return Announcement.findByIdAndUpdate(
      announcementId,
      {
        $addToSet: {
          acknowledgements: {
            userId: new Types.ObjectId(userId),
            acknowledgedAt: new Date(),
          },
        },
      },
      { new: true },
    );
  }

  async getAnnouncementStats(schoolId: string) {
    const total = await Announcement.countDocuments({ schoolId });
    const published = await Announcement.countDocuments({ schoolId, isPublished: true });
    const pendingAcknowledgement = await Announcement.countDocuments({
      schoolId,
      requiresAcknowledgement: true,
      isPublished: true,
    });
    return { total, published, pendingAcknowledgement };
  }

  async deleteAnnouncement(announcementId: string) {
    return Announcement.findByIdAndDelete(announcementId);
  }
}
