import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { nanoid } from 'nanoid';
import { ROLES } from '../constants/roles.js';
import { Teacher } from '../models/teacher.model.js';
import { Class } from '../models/class.model.js';
import { ClassStudent } from '../models/class-student.model.js';
import { User } from '../models/user.model.js';
import { Task } from '../models/task.model.js';
import { Activity } from '../models/activity.model.js';
import { ApiError } from '../utils/api-error.js';
import { createAccessToken, createRefreshToken } from './token.service.js';
import { NotificationService } from './notification.service.js';

function generateTeacherCode() {
  const num = nanoid(4).toUpperCase();
  return `KD-TR-${num}`;
}

function generateClassCode() {
  const code = nanoid(5).toUpperCase();
  return `CLS-${code}`;
}

export async function createTeacher(adminId: string, input: {
  fullName: string;
  email: string;
  schoolName: string;
  phone?: string;
}) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const existing = await Teacher.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'A teacher with this email already exists');
  }

  let teacherCode = generateTeacherCode();
  while (await Teacher.exists({ teacherCode })) {
    teacherCode = generateTeacherCode();
  }

  const teacher = await Teacher.create({
    teacherCode,
    fullName: input.fullName.trim(),
    email: normalizedEmail,
    phone: input.phone?.trim() ?? '',
    schoolName: input.schoolName.trim(),
    status: 'pending',
    createdByAdmin: adminId,
  });

  await Activity.create({
    actorId: adminId,
    type: 'teacher_created',
    message: `Created teacher account for "${input.fullName}" (${teacherCode})`,
    metadata: { teacherId: teacher.id, teacherCode },
  });

  return teacher.toObject();
}

export async function activateTeacher(input: {
  teacherCode: string;
  email: string;
  password: string;
}) {
  const normalizedCode = input.teacherCode.trim().toUpperCase();
  const normalizedEmail = input.email.toLowerCase().trim();

  const teacher = await Teacher.findOne({ teacherCode: normalizedCode });
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid teacher code');
  }
  if (teacher.email !== normalizedEmail) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Email does not match the teacher code');
  }
  if (teacher.status !== 'pending') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Account is already activated or disabled');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  teacher.passwordHash = passwordHash;
  teacher.status = 'active';
  await teacher.save();

  return buildTeacherAuthPayload(teacher);
}

export async function teacherLogin(input: {
  identifier: string;
  password: string;
}) {
  const identifier = input.identifier.trim().toLowerCase();
  const teacher = await Teacher.findOne({
    $or: [
      { email: identifier },
      { teacherCode: identifier.toUpperCase() },
    ],
  });

  if (!teacher) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }
  if (teacher.status !== 'active') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Account is not active. Please activate your account first.');
  }
  if (!teacher.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Password not set. Please activate your account first.');
  }

  const isValid = await bcrypt.compare(input.password, teacher.passwordHash);
  if (!isValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  return buildTeacherAuthPayload(teacher);
}

export async function getTeacherProfile(teacherId: string) {
  const teacher = await Teacher.findById(teacherId).select('-passwordHash').lean();
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }
  return teacher;
}

export async function updateTeacherProfile(teacherId: string, input: {
  fullName?: string;
  phone?: string;
  schoolName?: string;
}) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }
  if (input.fullName !== undefined) teacher.fullName = input.fullName.trim();
  if (input.phone !== undefined) teacher.phone = input.phone.trim();
  if (input.schoolName !== undefined) teacher.schoolName = input.schoolName.trim();
  await teacher.save();
  return teacher.toObject();
}

export async function getTeacherDashboard(teacherId: string) {
  const teacher = await Teacher.findById(teacherId).select('-passwordHash').lean();
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }

  const classes = await Class.find({ teacherId, isArchived: false }).lean();

  const classIds = classes.map(c => c._id);
  const totalStudents = await ClassStudent.countDocuments({ classId: { $in: classIds }, status: 'active' });
  const activeTasks = await Task.countDocuments({ createdBy: teacherId, status: { $in: ['todo', 'in_progress'] } });
  const completedTasks = await Task.countDocuments({ createdBy: teacherId, status: 'completed' });

  return {
    teacher,
    totalClasses: classes.length,
    totalStudents,
    activeTasks,
    completedTasks,
    classes,
  };
}

// --- Class Management ---

export async function createClass(teacherId: string, input: {
  className: string;
  grade: number;
  description?: string;
}) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }

  let classCode = generateClassCode();
  while (await Class.exists({ classCode })) {
    classCode = generateClassCode();
  }

  const cls = await Class.create({
    teacherId,
    className: input.className.trim(),
    grade: input.grade,
    classCode,
    description: input.description?.trim() ?? '',
  });

  teacher.totalClasses += 1;
  await teacher.save();

  return cls.toObject();
}

export async function updateClass(teacherId: string, classId: string, input: {
  className?: string;
  grade?: number;
  description?: string;
}) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }
  if (input.className !== undefined) cls.className = input.className.trim();
  if (input.grade !== undefined) cls.grade = input.grade;
  if (input.description !== undefined) cls.description = input.description.trim();
  await cls.save();
  return cls.toObject();
}

export async function archiveClass(teacherId: string, classId: string) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }
  cls.isArchived = true;
  await cls.save();

  const teacher = await Teacher.findById(teacherId);
  if (teacher && teacher.totalClasses > 0) {
    teacher.totalClasses -= 1;
    await teacher.save();
  }

  return { success: true };
}

export async function getTeacherClasses(teacherId: string) {
  return Class.find({ teacherId, isArchived: false }).sort({ createdAt: -1 }).lean();
}

// --- Student Management ---

export async function addStudentToClass(teacherId: string, classId: string, childId: string) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }

  const child = await User.findOne({ _id: childId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child account not found');
  }

  const existing = await ClassStudent.findOne({ classId, childId });
  if (existing) {
    if (existing.status === 'active') {
      throw new ApiError(StatusCodes.CONFLICT, 'Student is already in this class');
    }
    existing.status = 'active';
    await existing.save();
  } else {
    await ClassStudent.create({ classId, childId });
  }

  child.schoolName = cls.className;
  child.teacherId = teacherId as any;
  child.classId = classId as any;
  await child.save();

  cls.totalStudents = await ClassStudent.countDocuments({ classId, status: 'active' });
  await cls.save();

  const teacher = await Teacher.findById(teacherId);
  if (teacher) {
    teacher.totalStudents = await ClassStudent.countDocuments({ classId: { $in: (await Class.find({ teacherId })).map(c => c._id) }, status: 'active' });
    await teacher.save();
  }

  return { success: true };
}

export async function removeStudentFromClass(teacherId: string, classId: string, childId: string) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }

  const mapping = await ClassStudent.findOne({ classId, childId, status: 'active' });
  if (!mapping) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Student not found in this class');
  }

  mapping.status = 'removed';
  await mapping.save();

  const child = await User.findById(childId);
  if (child) {
    child.schoolName = '';
    child.teacherId = undefined;
    child.classId = undefined;
    await child.save();
  }

  cls.totalStudents = await ClassStudent.countDocuments({ classId, status: 'active' });
  await cls.save();

  const teacher = await Teacher.findById(teacherId);
  if (teacher) {
    teacher.totalStudents = await ClassStudent.countDocuments({ classId: { $in: (await Class.find({ teacherId })).map(c => c._id) }, status: 'active' });
    await teacher.save();
  }

  return { success: true };
}

export async function getClassStudents(teacherId: string, classId: string) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }

  const mappings = await ClassStudent.find({ classId, status: 'active' }).lean();
  const childIds = mappings.map(m => m.childId);
  const children = await User.find({ _id: { $in: childIds }, role: 'child' })
    .select('firstName lastName email avatar points streak standard childLoginCode')
    .lean();

  return children;
}

export async function inviteStudentByCode(teacherId: string, classId: string, childLoginCode: string) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }

  const child = await User.findOne({ childLoginCode: childLoginCode.toUpperCase(), role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No child found with this access code');
  }

  return addStudentToClass(teacherId, classId, child.id);
}

// --- Teacher Task Management ---

export async function createTeacherTask(
  teacherId: string,
  input: {
    title: string;
    description?: string;
    points: number;
    dueDate?: string;
    difficulty?: string;
    classId: string;
    assignedTo?: string;
    category?: string;
    skillTag?: string;
  },
) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }

  const cls = await Class.findOne({ _id: input.classId, teacherId });
  if (!cls) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Class not found');
  }

  let assignedChildren: string[] = [];

  if (input.assignedTo) {
    assignedChildren = [input.assignedTo];
  } else {
    const mappings = await ClassStudent.find({ classId: input.classId, status: 'active' }).lean();
    assignedChildren = mappings.map(m => String(m.childId));
  }

  const createdTasks = [];
  for (const childId of assignedChildren) {
    const task = await Task.create({
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      points: input.points,
      assignedTo: childId,
      createdBy: teacherId,
      familyId: 'teacher',
      category: input.category ?? 'School',
      skillTag: input.skillTag ?? '',
      status: 'todo',
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    });
    createdTasks.push(task);

    NotificationService.sendToUser(
      childId,
      'New School Task! 📚',
      `You have a new task: "${input.title}". Complete it to earn ${input.points} points!`,
    ).catch(() => {});
  }

  teacher.totalTasksCreated += createdTasks.length;
  await teacher.save();

  return createdTasks;
}

export async function awardBonusPoints(
  teacherId: string,
  childId: string,
  points: number,
  reason: string,
) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }

  const child = await User.findOne({ _id: childId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  child.points = (child.points || 0) + points;
  child.xp = (child.xp || 0) + points * 10;
  await child.save();

  NotificationService.sendToUser(
    childId,
    'Bonus Points! 🌟',
    `You earned ${points} bonus points from ${teacher.fullName}: ${reason}`,
  ).catch(() => {});

  return { success: true, totalPoints: child.points };
}

// --- Leaderboard ---

export async function getClassLeaderboard(classId: string) {
  const mappings = await ClassStudent.find({ classId, status: 'active' }).lean();
  const childIds = mappings.map(m => m.childId);
  const children = await User.find({ _id: { $in: childIds }, role: 'child' })
    .select('firstName lastName points streak level xp avatar')
    .sort({ points: -1 })
    .lean();

  return children.map((c, idx) => ({
    rank: idx + 1,
    childId: c._id,
    firstName: c.firstName,
    lastName: c.lastName,
    points: c.points ?? 0,
    streak: c.streak ?? 0,
    level: c.level ?? 1,
    xp: c.xp ?? 0,
    avatar: c.avatar,
  }));
}

export async function awardBadge(
  teacherId: string,
  childId: string,
  badgeTitle: string,
  reason: string,
) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }

  const child = await User.findOne({ _id: childId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const existingBadge = (child.obtainedRewards || []).find(
    (r: any) => r.title === badgeTitle,
  );
  if (existingBadge) {
    throw new ApiError(StatusCodes.CONFLICT, 'Child already has this badge');
  }

  child.obtainedRewards.push({
    title: badgeTitle,
    redeemedAt: new Date(),
    pointsSpent: 0,
    rewardId: null as any,
  } as any);
  child.xp = (child.xp || 0) + 50;
  await child.save();

  NotificationService.sendToUser(
    childId,
    'New Badge Earned! 🏅',
    `You earned the "${badgeTitle}" badge from ${teacher.fullName}: ${reason}`,
  ).catch(() => {});

  return { success: true, badge: badgeTitle, totalXP: child.xp };
}

export async function getSchoolLeaderboard(schoolName: string, period?: 'weekly' | 'monthly') {
  const teachers = await Teacher.find({ schoolName }).lean();
  const teacherIds = teachers.map(t => t._id);
  const classes = await Class.find({ teacherId: { $in: teacherIds }, isArchived: false }).lean();
  const classIds = classes.map(c => c._id);
  const mappings = await ClassStudent.find({ classId: { $in: classIds }, status: 'active' }).lean();
  const childIds = mappings.map(m => m.childId);

  const dateFilter: Record<string, unknown> = {};
  if (period === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter.$gte = weekAgo;
  } else if (period === 'monthly') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter.$gte = monthAgo;
  }

  const matchFilter: Record<string, unknown> = {
    _id: { $in: childIds },
    role: 'child',
  };

  const children = await User.find(matchFilter)
    .select('firstName lastName points streak level xp avatar')
    .sort({ points: -1 })
    .lean();

  return children.map((c, idx) => ({
    rank: idx + 1,
    childId: c._id,
    firstName: c.firstName,
    lastName: c.lastName,
    points: c.points ?? 0,
    streak: c.streak ?? 0,
    level: c.level ?? 1,
    xp: c.xp ?? 0,
    avatar: c.avatar,
  }));
}

export async function getChildTeacherInfo(childId: string) {
  const child = await User.findById(childId).select('schoolName teacherId classId').lean();
  if (!child || !child.teacherId || !child.classId) {
    return null;
  }

  const teacher = await Teacher.findById(child.teacherId).select('fullName email schoolName teacherCode').lean();
  const cls = await Class.findById(child.classId).select('className grade classCode').lean();

  if (!teacher || !cls) return null;

  return {
    teacherName: teacher.fullName,
    teacherEmail: teacher.email,
    schoolName: teacher.schoolName,
    teacherCode: teacher.teacherCode,
    className: cls.className,
    grade: cls.grade,
    classCode: cls.classCode,
  };
}

// ---------------------------------------------------------------------------
// Teacher: award specific action points via RewardService
// ---------------------------------------------------------------------------

export async function awardAction(
  teacherId: string,
  childId: string,
  action: string,
  label: string,
  points?: number,
) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Teacher not found');
  }

  const child = await User.findOne({ _id: childId, role: 'child' });
  if (!child) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Child not found');
  }

  const { RewardService } = await import('./reward.service.js');
  const result = await RewardService.awardPoints(
    childId,
    action,
    points,
    'teacher',
    undefined,
    `${label} reward from ${teacher.fullName}`,
    teacherId,
  );

  NotificationService.sendToUser(
    childId,
    `${label} Reward!`,
    `You earned points for ${label} from ${teacher.fullName}!`,
  ).catch(() => {});

  return result;
}

function buildTeacherAuthPayload(teacher: any) {
  const accessToken = createAccessToken({
    sub: String(teacher._id),
    role: ROLES.TEACHER,
  });

  const refreshToken = createRefreshToken({
    sub: String(teacher._id),
    role: ROLES.TEACHER,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: String(teacher._id),
      role: ROLES.TEACHER,
      firstName: teacher.fullName,
      lastName: '',
      email: teacher.email,
      teacherCode: teacher.teacherCode,
      schoolName: teacher.schoolName,
      status: teacher.status,
    },
  };
}
