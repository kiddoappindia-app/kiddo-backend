import { Schema, model, Types } from 'mongoose';

export type EventType =
  | 'task_completed' | 'task_approved' | 'task_rejected' | 'task_missed'
  | 'homework_submitted' | 'homework_graded' | 'homework_late' | 'homework_missed'
  | 'reward_earned' | 'reward_redeemed' | 'reward_approved'
  | 'attendance_marked' | 'attendance_present' | 'attendance_late' | 'attendance_absent'
  | 'reading_session' | 'exercise_completed' | 'fitness_session'
  | 'avatar_level_up' | 'achievement_unlocked' | 'streak_milestone'
  | 'parent_approval' | 'teacher_feedback' | 'store_purchase'
  | 'daily_gift_claimed' | 'mission_completed' | 'challenge_completed'
  | 'pet_interaction' | 'world_travel' | 'seasonal_participation'
  | 'growth_milestone' | 'habit_detected' | 'insight_generated';

export type EventSource = 'home' | 'school' | 'system';

const intelligenceEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'SchoolClass' },
    type: { type: String, required: true, index: true },
    source: { type: String, enum: ['home', 'school', 'system'], required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: {
      taskId: { type: Schema.Types.ObjectId },
      assignmentId: { type: Schema.Types.ObjectId },
      rewardId: { type: Schema.Types.ObjectId },
      subjectId: { type: Schema.Types.ObjectId },
      achievementId: { type: Schema.Types.ObjectId },
      category: { type: String },
      points: { type: Number },
      xp: { type: Number },
      coins: { type: Number },
      duration: { type: Number },
      difficulty: { type: String },
      status: { type: String },
      grade: { type: Number },
      streak: { type: Number },
      level: { type: Number },
      value: { type: Number },
      unit: { type: String },
      custom: { type: Schema.Types.Mixed },
    },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

intelligenceEventSchema.index({ userId: 1, type: 1, timestamp: -1 });
intelligenceEventSchema.index({ userId: 1, timestamp: -1 });
intelligenceEventSchema.index({ familyId: 1, timestamp: -1 });
intelligenceEventSchema.index({ processed: 1, timestamp: 1 });

export const IntelligenceEvent = model('IntelligenceEvent', intelligenceEventSchema);
