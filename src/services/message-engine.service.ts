import { Message } from '../models/message.model.js';
import { Types } from 'mongoose';

export class MessageEngineService {
  async sendMessage(data: any) {
    const message = await Message.create(data);
    return message.populate([
      { path: 'senderId', select: 'firstName lastName avatar' },
      { path: 'receiverId', select: 'firstName lastName avatar' },
    ]);
  }

  async getConversation(userId1: string, userId2: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    return Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      isArchived: false,
    })
      .populate('senderId', 'firstName lastName avatar')
      .populate('replyTo', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async getConversations(userId: string) {
    const conversations = await Message.aggregate([
      { $match: { $or: [{ senderId: new Types.ObjectId(userId) }, { receiverId: new Types.ObjectId(userId) }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', new Types.ObjectId(userId)] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', new Types.ObjectId(userId)] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    return Message.populate(conversations, [
      { path: '_id', select: 'firstName lastName avatar' },
      { path: 'lastMessage.senderId', select: 'firstName lastName avatar' },
    ]);
  }

  async markAsRead(messageId: string) {
    return Message.findByIdAndUpdate(
      messageId,
      { isRead: true, readAt: new Date() },
      { new: true },
    );
  }

  async markConversationAsRead(userId: string, otherUserId: string) {
    return Message.updateMany(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string) {
    return Message.countDocuments({ receiverId: userId, isRead: false });
  }

  async deleteMessage(messageId: string) {
    return Message.findByIdAndDelete(messageId);
  }

  async getStudentMessages(studentId: string) {
    return Message.find({ studentId })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
  }

  async getMessageThreads(assignmentId: string) {
    return Message.find({ assignmentId })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 });
  }
}
