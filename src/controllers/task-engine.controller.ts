import { Request, Response } from 'express';
import { TaskEngine } from '../services/task-engine.service.js';
import { RewardEngine } from '../services/reward-engine.service.js';
import { Task } from '../models/task.model.js';
import { TaskCompletion } from '../models/task-completion.model.js';
import { TaskTemplate } from '../models/task-template.model.js';

export class TaskController {
  static async createTask(req: Request, res: Response) {
    try {
      const task = await TaskEngine.createTask({
        ...req.body,
        createdBy: (req as any).user.id,
        familyId: (req as any).user.familyId,
      });
      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTasks(req: Request, res: Response) {
    try {
      const { status, childId, category, dueDate, limit, offset } = req.query;
      const tasks = await TaskEngine.getFamilyTasks(
        (req as any).user.familyId,
        {
          status: status as string,
          childId: childId as string,
          category: category as string,
          dueDate: dueDate ? new Date(dueDate as string) : undefined,
        },
        Number(limit) || 50,
        Number(offset) || 0,
      );
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getChildTasks(req: Request, res: Response) {
    try {
      const childId = req.params.childId as string;
      const { status, limit, offset } = req.query;
      const tasks = await TaskEngine.getChildTasks(
        childId,
        status as string,
        Number(limit) || 20,
        Number(offset) || 0,
      );
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTask(req: Request, res: Response) {
    try {
      const taskId = req.params.taskId as string;
      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTask(req: Request, res: Response) {
    try {
      const taskId = req.params.taskId as string;
      const task = await Task.findByIdAndUpdate(taskId, req.body, { new: true });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteTask(req: Request, res: Response) {
    try {
      const taskId = req.params.taskId as string;
      const task = await Task.findByIdAndDelete(taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async completeTask(req: Request, res: Response) {
    try {
      const taskId = req.params.taskId as string;
      const result = await TaskEngine.completeTask(
        taskId,
        (req as any).user.id,
        req.body,
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async approveTask(req: Request, res: Response) {
    try {
      const completionId = req.params.completionId as string;
      const completion = await TaskEngine.approveTask(
        completionId,
        (req as any).user.id,
        req.body.approved,
        req.body.reason,
      );
      res.json({ success: true, data: completion });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTaskPreview(req: Request, res: Response) {
    try {
      const { basePoints, difficulty, timeSpentMinutes, streakCount } = req.query;
      const preview = await RewardEngine.calculatePreview(
        (req as any).user.familyId,
        {
          basePoints: Number(basePoints) || 20,
          difficulty: (difficulty as string) || 'medium',
          timeSpentMinutes: Number(timeSpentMinutes) || 0,
          streakCount: Number(streakCount) || 0,
        },
      );
      res.json({ success: true, data: preview });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async bulkAssign(req: Request, res: Response) {
    try {
      const { taskIds, childIds } = req.body;
      const tasks = await TaskEngine.bulkAssign(taskIds, childIds);
      res.status(201).json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async archiveOldTasks(req: Request, res: Response) {
    try {
      const count = await TaskEngine.archiveCompletedTasks(
        (req as any).user.familyId,
        Number(req.query.olderThanDays) || 30,
      );
      res.json({ success: true, data: { archived: count } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCompletions(req: Request, res: Response) {
    try {
      const taskId = req.params.taskId as string;
      const completions = await TaskCompletion.find({ taskId })
        .sort({ completedAt: -1 })
        .lean();
      res.json({ success: true, data: completions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export class TaskTemplateController {
  static async createTemplate(req: Request, res: Response) {
    try {
      const template = await TaskTemplate.create({
        ...req.body,
        createdBy: (req as any).user.id,
        familyId: (req as any).user.familyId,
      });
      res.status(201).json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTemplates(req: Request, res: Response) {
    try {
      const templates = await TaskTemplate.find({
        familyId: (req as any).user.familyId,
      }).sort({ createdAt: -1 });
      res.json({ success: true, data: templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTemplate(req: Request, res: Response) {
    try {
      const templateId = req.params.templateId as string;
      const template = await TaskTemplate.findByIdAndUpdate(templateId, req.body, { new: true });
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ success: true, data: template });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteTemplate(req: Request, res: Response) {
    try {
      const templateId = req.params.templateId as string;
      const template = await TaskTemplate.findByIdAndDelete(templateId);
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createTaskFromTemplate(req: Request, res: Response) {
    try {
      const templateId = req.params.templateId as string;
      const task = await TaskEngine.createFromTemplate(templateId, req.body.childId, req.body.overrides);
      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
