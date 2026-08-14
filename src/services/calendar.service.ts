import { CalendarEvent } from '../models/calendar-event.model.js';
import { Types } from 'mongoose';

export class CalendarService {
  async createEvent(data: any) {
    return CalendarEvent.create(data);
  }

  async updateEvent(eventId: string, data: any) {
    return CalendarEvent.findByIdAndUpdate(eventId, data, { new: true });
  }

  async deleteEvent(eventId: string) {
    return CalendarEvent.findByIdAndDelete(eventId);
  }

  async getSchoolEvents(schoolId: string, startDate: Date, endDate: Date) {
    return CalendarEvent.find({
      schoolId,
      startDate: { $gte: startDate, $lte: endDate },
      isVisible: true,
    }).sort({ startDate: 1 });
  }

  async getFamilyEvents(familyId: string, startDate: Date, endDate: Date) {
    return CalendarEvent.find({
      familyId,
      startDate: { $gte: startDate, $lte: endDate },
      isVisible: true,
    }).sort({ startDate: 1 });
  }

  async getStudentEvents(studentId: string, startDate: Date, endDate: Date) {
    return CalendarEvent.find({
      isVisible: true,
      $or: [
        { createdBy: studentId },
        { type: { $in: ['school_event', 'exam', 'holiday'] } },
      ],
      startDate: { $gte: startDate, $lte: endDate },
    }).sort({ startDate: 1 });
  }

  async getCombinedEvents(userId: string, familyId: string, startDate: Date, endDate: Date) {
    const [familyEvents, schoolEvents] = await Promise.all([
      CalendarEvent.find({
        familyId,
        startDate: { $gte: startDate, $lte: endDate },
      }),
      CalendarEvent.find({
        isVisible: true,
        startDate: { $gte: startDate, $lte: endDate },
        $or: [
          { createdBy: userId },
          { type: { $in: ['school_event', 'exam', 'holiday'] } },
        ],
      }),
    ]);

    const allEvents = [...familyEvents, ...schoolEvents];
    const uniqueEvents = Array.from(
      new Map(allEvents.map((e) => [e._id.toString(), e])).values(),
    );

    return uniqueEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async getUpcomingEvents(userId: string, days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return CalendarEvent.find({
      isVisible: true,
      startDate: { $gte: startDate, $lte: endDate },
      $or: [{ createdBy: userId }, { type: { $in: ['school_event', 'exam', 'holiday'] } }],
    }).sort({ startDate: 1 });
  }
}
