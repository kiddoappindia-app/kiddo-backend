import { Request, Response } from 'express';
import { MessageEngineService } from '../services/message-engine.service.js';

const service = new MessageEngineService();

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const message = await service.sendMessage({
      ...req.body,
      senderId: req.user?.id as string,
    });
    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await service.getConversation(
      req.user?.id as string,
      req.params.userId as string,
      parseInt(page as string),
      parseInt(limit as string),
    );
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const conversations = await service.getConversations(req.user?.id as string);
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    await service.markAsRead(req.params.messageId as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markConversationAsRead = async (req: Request, res: Response) => {
  try {
    await service.markConversationAsRead(req.user?.id as string, req.params.userId as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await service.getUnreadCount(req.user?.id as string);
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentMessages = async (req: Request, res: Response) => {
  try {
    const messages = await service.getStudentMessages(req.params.studentId as string);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
