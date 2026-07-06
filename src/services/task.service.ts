import { StatusCodes } from 'http-status-codes';
import { Activity } from '../models/activity.model.js';
import { Task } from '../models/task.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';
import { RewardService } from './reward.service.js';
import { NotificationService } from './notification.service.js';

export async function listTasks(familyId: string, userId?: string, role?: string) {
  let query: Record<string, unknown> = { familyId };

  if (role === 'child') {
    query = {
      assignedTo: userId,
      $or: [{ familyId }, { familyId: 'teacher' }],
    };
  }

  return Task.find(query).sort({ createdAt: -1 }).lean();
}

export async function createTask(
  familyId: string,
  createdBy: string,
  input: {
    assignedTo: string;
    title: string;
    description?: string;
    category?: string;
    points: number;
    dueDate?: string;
    skillTag?: string;
    requiresPhoto?: boolean;
    rewardUnlockThreshold?: number;
    isRecurring?: boolean;
    recurrenceInterval?: 'daily' | 'weekly' | 'monthly';
  },
) {
  const task = await Task.create({
    familyId,
    createdBy,
    assignedTo: input.assignedTo,
    title: input.title,
    description: input.description ?? '',
    category: input.category ?? 'General',
    points: input.points,
    skillTag: input.skillTag ?? '',
    requiresPhoto: input.requiresPhoto ?? false,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    rewardUnlockThreshold: input.rewardUnlockThreshold ?? 0,
    isRecurring: input.isRecurring ?? false,
    recurrenceInterval: input.recurrenceInterval ?? 'daily',
  });

  await Activity.create({
    familyId,
    actorId: createdBy,
    type: 'task_created',
    message: `Created task "${task.title}"`,
    metadata: { taskId: task.id },
  });

  // Send Push Notification to Child
  NotificationService.sendToUser(
    input.assignedTo,
    'New Quest Assigned! 🚀',
    `You have a new quest: "${task.title}". Tap to view and earn ${task.points} points!`
  ).catch(() => {});

  return task;
}

export async function updateTask(
  taskId: string,
  familyId: string,
  input: Record<string, unknown>,
  actorRole: string,
  actorId: string,
) {
  const task = await Task.findOne({ _id: taskId, familyId });
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  if (actorRole === 'child' && String(task.assignedTo) !== actorId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You can only update your own tasks');
  }

  if (input.status === 'completed') {
    task.completedAt = new Date();
    await updateStreak(String(task.assignedTo));
    await Activity.create({
      familyId,
      actorId,
      type: 'task_completed',
      message: `Completed task "${task.title}"`,
      metadata: { taskId: task.id },
    });

    // Send Push Notification to Parents or Teacher
    if (familyId === 'teacher' && task.createdBy) {
      NotificationService.sendToTeacher(
        String(task.createdBy),
        'Task Completed! ✅',
        `A student completed: "${task.title}". Tap to review.`
      ).catch(() => {});
    } else {
      NotificationService.sendToFamilyParents(
        familyId,
        'Quest Completed! 🛡️',
        `A child has completed the quest: "${task.title}". Tap to review and approve it!`
      ).catch(() => {});
    }
  }

  if (input.status === 'approved') {
    task.approvedAt = new Date();
    const xpGain = task.points * 10;

    // Use centralized RewardService for point awarding
    const childId = String(task.assignedTo);
    const actionType = task.skillTag
      ? `task_${task.skillTag.toLowerCase()}`
      : 'task_completed';

    await RewardService.awardPoints(
      childId,
      actionType,
      task.points,
      'task',
      task._id.toString(),
      `Approved task "${task.title}" (+${task.points} pts, +${xpGain} XP)`,
      actorId,
    ).catch((err) => {
      console.error('RewardService.awardPoints failed (task approval):', err);
    });

    const user = await User.findById(task.assignedTo);
    if (user) {
      // XP is managed by RewardService, but we also apply skill XP here
      if (!user.skillXP) user.skillXP = { intelligence: 0, strength: 0, kindness: 0 };
      const tag = (task.skillTag || '').toLowerCase();
      const cat = (task.category || '').toLowerCase();
      
      if (['academic', 'learning', 'self-learning', 'organization', 'planning', 'intelligence'].some((k) => tag.includes(k) || cat.includes(k))) {
        user.skillXP.intelligence += xpGain;
      } else if (['chores', 'fitness', 'responsibility', 'independence', 'self-reliance', 'self-care', 'strength'].some((k) => tag.includes(k) || cat.includes(k))) {
        user.skillXP.strength += xpGain;
      } else {
        user.skillXP.kindness += xpGain;
      }
      await user.save();
    }

    await Activity.create({
      familyId,
      actorId: actorId,
      type: 'task_approved',
      message: `Approved task "${task.title}" (+${task.points} pts, +${xpGain} XP)`,
      metadata: { taskId: task.id },
    });

    // Handle Recurrence
    if (task.isRecurring) {
      const nextDueDate = new Date(task.dueDate || new Date());
      if (task.recurrenceInterval === 'weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (task.recurrenceInterval === 'monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else {
        // Default to daily
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      }

      await Task.create({
        familyId: task.familyId,
        createdBy: task.createdBy,
        assignedTo: task.assignedTo,
        title: task.title,
        description: task.description,
        category: task.category,
        points: task.points,
        skillTag: task.skillTag,
        requiresPhoto: task.requiresPhoto,
        isRecurring: true,
        recurrenceInterval: task.recurrenceInterval,
        dueDate: nextDueDate,
        status: 'todo',
      });
    }
  }

  Object.assign(task, input, {
    dueDate: typeof input.dueDate === 'string' ? new Date(input.dueDate) : input.dueDate,
  });

  await task.save();
  return task;
}

export async function deleteTask(taskId: string, familyId: string, actorRole: string, actorId: string) {
  if (actorRole !== 'parent' && actorRole !== 'admin') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only parents and admins can delete tasks');
  }

  const task = await Task.findOneAndDelete({ _id: taskId, familyId });
  if (!task) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Task not found');
  }

  await Activity.create({
    familyId,
    actorId,
    type: 'task_deleted',
    message: `Deleted task "${task.title}"`,
    metadata: { taskId: task.id },
  });

  return { success: true };
}

export async function seedStockTasks(familyId: string, createdBy: string) {
  // Delete existing tasks for this family
  await Task.deleteMany({ familyId });

  // Get all active children in the family
  const children = await User.find({ familyId, role: 'child', isActive: true });
  if (children.length === 0) return [];

  const stockTasks = [
    { title: "Wake up on time", category: "Morning", points: 10, skillTag: "Discipline", requiresPhoto: false },
    { title: "Silent Prayer", category: "Morning", points: 5, skillTag: "Mindfulness", requiresPhoto: false },
    { title: "Smile in the mirror", category: "Morning", points: 5, skillTag: "Self-confidence", requiresPhoto: false },
    { title: "Make your bed", category: "Morning", points: 15, skillTag: "Responsibility", requiresPhoto: true },
    { title: "Wear uniform neatly", category: "Morning", points: 10, skillTag: "Self-care", requiresPhoto: true },
    { title: "Personal hygiene", category: "Morning", points: 10, skillTag: "Hygiene", requiresPhoto: false },
    { title: "Drink water", category: "Morning", points: 5, skillTag: "Health", requiresPhoto: false },
    { title: "Exercise (10-20 min)", category: "Morning", points: 20, skillTag: "Fitness", requiresPhoto: false },
    { title: "Prepare school bag", category: "Morning", points: 10, skillTag: "Organization", requiresPhoto: true },
    { title: "Greet teachers", category: "School", points: 10, skillTag: "Respect", requiresPhoto: false },
    { title: "Maintain discipline", category: "School", points: 10, skillTag: "Discipline", requiresPhoto: false },
    { title: "Help classmates", category: "School", points: 15, skillTag: "Empathy", requiresPhoto: false },
    { title: "No arguing", category: "School", points: 15, skillTag: "Emotional control", requiresPhoto: false },
    { title: "Keep classroom clean", category: "School", points: 15, skillTag: "Responsibility", requiresPhoto: false },
    { title: "Participate in class", category: "School", points: 15, skillTag: "Confidence", requiresPhoto: false },
    { title: "Wash hands", category: "After School", points: 10, skillTag: "Hygiene", requiresPhoto: false },
    { title: "Fold uniform", category: "After School", points: 15, skillTag: "Responsibility", requiresPhoto: true },
    { title: "Help parents", category: "After School", points: 20, skillTag: "Responsibility", requiresPhoto: false },
    { title: "Revise lessons", category: "After School", points: 20, skillTag: "Learning", requiresPhoto: false },
    { title: "Organize desk", category: "After School", points: 15, skillTag: "Organization", requiresPhoto: true },
    { title: "Complete homework", category: "After School", points: 30, skillTag: "Self-learning", requiresPhoto: true },
    { title: "Read for 20 mins", category: "After School", points: 20, skillTag: "Learning", requiresPhoto: false },
    { title: "Avoid screen time", category: "After School", points: 15, skillTag: "Discipline", requiresPhoto: false },
    { title: "Dinner with family", category: "Night", points: 10, skillTag: "Manners", requiresPhoto: false },
    { title: "Brush teeth", category: "Night", points: 10, skillTag: "Hygiene", requiresPhoto: true },
    { title: "Iron uniform", category: "Night", points: 20, skillTag: "Self-reliance", requiresPhoto: true },
    { title: "Make next day plan", category: "Night", points: 10, skillTag: "Time management", requiresPhoto: false },
    { title: "Pray before sleep", category: "Night", points: 10, skillTag: "Calmness", requiresPhoto: false },
    { title: "Sleep before 10 PM", category: "Night", points: 15, skillTag: "Health", requiresPhoto: false }
  ];

  const tasksToCreate = [];
  for (const child of children) {
    for (const stock of stockTasks) {
      tasksToCreate.push({
        ...stock,
        familyId,
        createdBy,
        assignedTo: child.id,
        description: `Routine task for ${stock.category}`,
      });
    }
  }

  const createdTasks = await Task.insertMany(tasksToCreate);

  await Activity.create({
    familyId,
    actorId: createdBy,
    type: 'task_created',
    message: `Reset and seeded ${createdTasks.length} routine tasks for the family.`,
  });

  return createdTasks;
}

async function updateStreak(userId: string) {
  const child = await User.findById(userId).populate('inventory');
  if (!child) return;

  const lastCompleted = child.lastCompletedAt;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (!lastCompleted) {
    child.streak = 1;
  } else {
    const sameDay = lastCompleted.toDateString() === now.toDateString();
    const continued = lastCompleted.toDateString() === yesterday.toDateString();
    
    if (sameDay) {
      // Already updated for today
    } else if (continued) {
      child.streak += 1;
    } else {
      // Missed a day! Check for Streak Shield
      const shieldIndex = (child.inventory as any[]).findIndex(item => item.name === 'Streak Shield');
      if (shieldIndex !== -1) {
        // Shield protected the streak!
        child.streak += 1;
        // Consume the shield
        child.inventory.splice(shieldIndex, 1);
        
        await Activity.create({
          familyId: child.familyId,
          actorId: child.id,
          type: 'powerup_completed',
          message: `Streak Shield activated! Streak preserved at ${child.streak}.`,
        });
      } else {
        child.streak = 1;
      }
    }
  }

  child.lastCompletedAt = now;
  await child.save();
}
