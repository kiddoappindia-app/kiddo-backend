import { firebaseAdmin } from '../config/firebase-admin.js';
import { User } from '../models/user.model.js';

export type NotificationCategory =
  | 'task_completed'
  | 'task_approved'
  | 'task_rejected'
  | 'task_new'
  | 'task_reminder'
  | 'reward_approved'
  | 'reward_rejected'
  | 'reward_redeemed'
  | 'achievement_unlocked'
  | 'low_wallet'
  | 'daily_summary'
  | 'weekly_summary'
  | 'reminder'
  | 'system';

const CATEGORY_TITLES: Record<NotificationCategory, string> = {
  task_completed: 'Task Completed',
  task_approved: 'Task Approved',
  task_rejected: 'Task Needs Revision',
  task_new: 'New Task',
  task_reminder: 'Task Reminder',
  reward_approved: 'Reward Approved',
  reward_rejected: 'Reward Declined',
  reward_redeemed: 'Reward Redeemed',
  achievement_unlocked: 'Achievement Unlocked',
  low_wallet: 'Low Balance',
  daily_summary: 'Daily Summary',
  weekly_summary: 'Weekly Summary',
  reminder: 'Reminder',
  system: 'KidDo',
};

export class NotificationService {
  static async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    category?: NotificationCategory,
  ) {
    try {
      const user = await User.findById(userId).select('notificationToken settings').lean();
      if (!user || !user.notificationToken) {
        console.log(`User ${userId} has no notification token, skipping push.`);
        return;
      }

      if (category && user.settings) {
        if (!isNotificationEnabled(category, user.settings)) {
          console.log(`Notification category ${category} disabled for user ${userId}`);
          return;
        }
      }

      const message = {
        notification: {
          title: title || CATEGORY_TITLES[category || 'system'],
          body,
        },
        data: {
          ...data,
          category: category || 'system',
        },
        token: user.notificationToken,
      };

      const response = await firebaseAdmin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  static async sendToFamilyParents(
    familyId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    category?: NotificationCategory,
  ) {
    try {
      const parents = await User.find({ familyId, role: 'parent' })
        .select('notificationToken settings')
        .lean();

      const tokens = parents
        .filter((p) => {
          if (!p.notificationToken) return false;
          if (category && p.settings && !isNotificationEnabled(category, p.settings)) {
            return false;
          }
          return true;
        })
        .map((p) => p.notificationToken)
        .filter((t): t is string => !!t);

      if (tokens.length === 0) return;

      const message = {
        notification: {
          title: title || CATEGORY_TITLES[category || 'system'],
          body,
        },
        data: {
          ...data,
          category: category || 'system',
        },
        tokens,
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} messages were sent successfully`);
      return response;
    } catch (error) {
      console.error('Error sending multicast push notification:', error);
    }
  }

  static async sendToFamilyChildren(
    familyId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    category?: NotificationCategory,
  ) {
    try {
      const children = await User.find({ familyId, role: 'child', isActive: true })
        .select('notificationToken settings')
        .lean();

      const tokens = children
        .filter((c) => {
          if (!c.notificationToken) return false;
          if (category && c.settings && !isNotificationEnabled(category, c.settings)) {
            return false;
          }
          return true;
        })
        .map((c) => c.notificationToken)
        .filter((t): t is string => !!t);

      if (tokens.length === 0) return;

      const message = {
        notification: {
          title: title || CATEGORY_TITLES[category || 'system'],
          body,
        },
        data: {
          ...data,
          category: category || 'system',
        },
        tokens,
      };

      const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} child messages were sent successfully`);
      return response;
    } catch (error) {
      console.error('Error sending child push notification:', error);
    }
  }

  static async sendToTeacher(
    teacherId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      const { Teacher } = await import('../models/teacher.model.js');
      const teacher = await Teacher.findById(teacherId).lean();
      if (!teacher) return;
      const user = await User.findOne({ email: teacher.email })
        .select('notificationToken')
        .lean();
      if (!user || !user.notificationToken) return;

      const message = {
        notification: { title, body },
        data: data || {},
        token: user.notificationToken,
      };

      const response = await firebaseAdmin.messaging().send(message);
      console.log('Successfully sent teacher notification:', response);
      return response;
    } catch (error) {
      console.error('Error sending teacher notification:', error);
    }
  }
}

function isNotificationEnabled(category: NotificationCategory, settings: Record<string, unknown>): boolean {
  switch (category) {
    case 'task_completed':
    case 'task_approved':
    case 'task_rejected':
    case 'task_new':
      return settings.taskAlerts !== false;
    case 'reward_approved':
    case 'reward_rejected':
    case 'reward_redeemed':
      return settings.rewardAlerts !== false;
    case 'low_wallet':
      return settings.conversionAlerts !== false;
    case 'daily_summary':
    case 'weekly_summary':
      return settings.weeklySummary !== false;
    case 'reminder':
      return settings.reminderNotifications !== false;
    default:
      return true;
  }
}
