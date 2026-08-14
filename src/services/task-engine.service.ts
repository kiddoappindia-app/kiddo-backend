import { Task, ITask } from '../models/task.model.js';
import { TaskCompletion, ITaskCompletion } from '../models/task-completion.model.js';
import { TaskTemplate, ITaskTemplate } from '../models/task-template.model.js';
import { RewardEngine, RewardCalculation } from './reward-engine.service.js';

export class TaskEngine {
  static async createTask(data: Partial<ITask>): Promise<ITask> {
    const task = await Task.create({
      ...data,
      basePoints: data.points || 20,
      status: data.dueDate ? 'scheduled' : 'todo',
    });
    return task;
  }

  static async createFromTemplate(templateId: string, childId: string, overrides?: Partial<ITask>): Promise<ITask> {
    const template = await TaskTemplate.findById(templateId);
    if (!template) throw new Error('Template not found');

    await TaskTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

    return this.createTask({
      familyId: template.familyId,
      createdBy: template.createdBy,
      templateId: template._id as any,
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority as any,
      difficulty: template.difficulty as any,
      estimatedMinutes: template.estimatedMinutes,
      points: template.basePoints,
      basePoints: template.basePoints,
      proofRequired: template.proofRequired as any,
      parentApproval: template.parentApproval,
      teacherApproval: template.teacherApproval,
      isRecurring: template.isRecurring,
      recurrenceType: template.recurrenceType as any,
      recurrenceConfig: template.recurrenceConfig as any,
      skillTag: template.skillTag,
      tags: template.tags,
      assignedTo: childId as any,
      ...overrides,
    });
  }

  static async generateRecurringInstances(taskId: string): Promise<ITask[]> {
    const parentTask = await Task.findById(taskId);
    if (!parentTask || !parentTask.isRecurring) return [];

    const instances: ITask[] = [];
    const now = new Date();
    const config = parentTask.recurrenceConfig;

    if (!config) return [];

    const dates = this.calculateRecurrenceDates(parentTask, now);

    for (const date of dates) {
      const existingTask = await Task.findOne({
        templateId: parentTask._id,
        assignedTo: parentTask.assignedTo,
        dueDate: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        },
      });

      if (!existingTask) {
        const instance = await Task.create({
          familyId: parentTask.familyId,
          createdBy: parentTask.createdBy,
          assignedTo: parentTask.assignedTo,
          templateId: parentTask._id,
          title: parentTask.title,
          description: parentTask.description,
          category: parentTask.category,
          priority: parentTask.priority,
          difficulty: parentTask.difficulty,
          estimatedMinutes: parentTask.estimatedMinutes,
          points: parentTask.points,
          basePoints: parentTask.basePoints,
          proofRequired: parentTask.proofRequired,
          parentApproval: parentTask.parentApproval,
          teacherApproval: parentTask.teacherApproval,
          isRecurring: true,
          recurrenceType: parentTask.recurrenceType,
          recurrenceConfig: {
            ...config,
            occurrenceCount: (config.occurrenceCount || 0) + 1,
          },
          skillTag: parentTask.skillTag,
          tags: parentTask.tags,
          dueDate: date,
          startDate: date,
          status: 'scheduled',
        });
        instances.push(instance);
      }
    }

    return instances;
  }

  static calculateRecurrenceDates(task: ITask, startDate: Date): Date[] {
    const dates: Date[] = [];
    const config = task.recurrenceConfig;
    if (!config) return dates;

    const maxDates = config.maxOccurrences || 30;
    const interval = config.customIntervalDays || 1;

    for (let i = 0; i < maxDates; i++) {
      let date: Date;

      switch (task.recurrenceType) {
        case 'daily':
          date = new Date(startDate);
          date.setDate(date.getDate() + i);
          break;
        case 'weekly':
          date = new Date(startDate);
          date.setDate(date.getDate() + (i * 7));
          break;
        case 'monthly':
          date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          break;
        case 'custom':
          date = new Date(startDate);
          date.setDate(date.getDate() + (i * interval));
          break;
        case 'school_days':
          date = new Date(startDate);
          date.setDate(date.getDate() + i);
          while (date.getDay() === 0 || date.getDay() === 6) {
            date.setDate(date.getDate() + 1);
          }
          break;
        case 'weekends':
          date = new Date(startDate);
          date.setDate(date.getDate() + i);
          while (date.getDay() !== 0 && date.getDay() !== 6) {
            date.setDate(date.getDate() + 1);
          }
          break;
        default:
          date = new Date(startDate);
          date.setDate(date.getDate() + i);
      }

      if (config.endDate && date > config.endDate) break;
      if (config.excludeDates?.some(d =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      )) continue;

      dates.push(date);
    }

    return dates;
  }

  static async completeTask(
    taskId: string,
    childId: string,
    proofData?: { proofUrl?: string; proofData?: Record<string, any>; timeSpentMinutes?: number },
  ): Promise<{ completion: ITaskCompletion; reward: RewardCalculation }> {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    if (task.assignedTo.toString() !== childId) throw new Error('Not authorized');
    if (task.status === 'completed' || task.status === 'approved') throw new Error('Task already completed');

    const reward = await RewardEngine.calculate(task.familyId.toString(), {
      basePoints: task.basePoints,
      difficulty: task.difficulty,
      timeSpentMinutes: proofData?.timeSpentMinutes || 0,
      completedAt: new Date(),
      streakCount: 0,
      isPerfectDay: false,
      isPerfectWeek: false,
      isPerfectMonth: false,
    });

    const completion = await TaskCompletion.create({
      taskId: task._id,
      childId,
      familyId: task.familyId,
      status: task.parentApproval ? 'submitted' : 'approved',
      proofUrl: proofData?.proofUrl,
      proofData: proofData?.proofData,
      completedAt: new Date(),
      timeSpentMinutes: proofData?.timeSpentMinutes || 0,
      basePoints: reward.basePoints,
      bonusPoints: reward.totalPoints - reward.basePoints,
      totalPoints: reward.totalPoints,
      bonuses: reward.bonuses as any,
    });

    await Task.findByIdAndUpdate(taskId, {
      status: task.parentApproval ? 'completed' : 'approved',
      completedAt: new Date(),
      actualMinutes: proofData?.timeSpentMinutes || 0,
      proofUrl: proofData?.proofUrl,
      proofData: proofData?.proofData,
    });

    return { completion, reward };
  }

  static async approveTask(
    completionId: string,
    parentId: string,
    approved: boolean,
    reason?: string,
  ): Promise<ITaskCompletion> {
    const completion = await TaskCompletion.findById(completionId);
    if (!completion) throw new Error('Completion not found');

    if (approved) {
      completion.status = 'approved';
      completion.approvedAt = new Date();
      completion.approvedBy = parentId as any;
    } else {
      completion.status = 'rejected';
      completion.rejectedAt = new Date();
      completion.rejectionReason = reason;
      await Task.findByIdAndUpdate(completion.taskId, { status: 'rejected' });
    }

    await completion.save();
    return completion;
  }

  static async getChildTasks(
    childId: string,
    status?: string,
    limit = 20,
    offset = 0,
  ): Promise<ITask[]> {
    const query: any = { assignedTo: childId };
    if (status) query.status = status;

    return Task.find(query)
      .sort({ order: 1, dueDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean();
  }

  static async getFamilyTasks(
    familyId: string,
    filters?: { status?: string; childId?: string; category?: string; dueDate?: Date },
    limit = 50,
    offset = 0,
  ): Promise<ITask[]> {
    const query: any = { familyId };
    if (filters?.status) query.status = filters.status;
    if (filters?.childId) query.assignedTo = filters.childId;
    if (filters?.category) query.category = filters.category;
    if (filters?.dueDate) {
      query.dueDate = {
        $gte: new Date(filters.dueDate.getFullYear(), filters.dueDate.getMonth(), filters.dueDate.getDate()),
        $lt: new Date(filters.dueDate.getFullYear(), filters.dueDate.getMonth(), filters.dueDate.getDate() + 1),
      };
    }

    return Task.find(query)
      .sort({ order: 1, dueDate: 1 })
      .skip(offset)
      .limit(limit)
      .lean();
  }

  static async bulkAssign(
    taskIds: string[],
    childIds: string[],
  ): Promise<ITask[]> {
    const tasks: ITask[] = [];
    for (const taskId of taskIds) {
      const template = await Task.findById(taskId);
      if (!template) continue;

      for (const childId of childIds) {
        const task = await Task.create({
          familyId: template.familyId,
          createdBy: template.createdBy,
          templateId: template._id,
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          difficulty: template.difficulty,
          estimatedMinutes: template.estimatedMinutes,
          points: template.points,
          basePoints: template.basePoints,
          proofRequired: template.proofRequired,
          parentApproval: template.parentApproval,
          teacherApproval: template.teacherApproval,
          isRecurring: template.isRecurring,
          recurrenceType: template.recurrenceType,
          recurrenceConfig: template.recurrenceConfig,
          skillTag: template.skillTag,
          tags: template.tags,
      assignedTo: childId as any,
        });
        tasks.push(task);
      }
    }
    return tasks;
  }

  static async archiveCompletedTasks(familyId: string, olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await Task.updateMany(
      {
        familyId,
        status: { $in: ['approved', 'rejected'] },
        completedAt: { $lt: cutoffDate },
      },
      { status: 'archived' },
    );

    return result.modifiedCount;
  }
}
