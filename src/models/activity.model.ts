import { Schema, model } from 'mongoose';

const activitySchema = new Schema(
  {
    familyId: { type: Schema.Types.ObjectId, ref: 'Family' },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'task_created',
        'task_completed',
        'task_approved',
        'task_deleted',
        'reward_created',
        'reward_updated',
        'reward_redeemed',
        'game_reward_claimed',
        'child_added',
        'child_updated',
        'social_interaction',
        'reward_adjusted',
        'item_purchased',
        'xp_earned',
        'achievement_unlocked',
        'badge_earned',
        'challenge_completed',
        'mission_completed',
        'powerup_completed',
      ],
      required: true,
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Activity = model('Activity', activitySchema);
