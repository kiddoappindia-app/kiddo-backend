export const CAMPAIGN_TYPES = {
  DOUBLE_REWARD_WEEKEND: 'double_reward_weekend',
  HOLIDAY_EVENT: 'holiday_event',
  BIRTHDAY_REWARD: 'birthday_reward',
  FESTIVAL_CAMPAIGN: 'festival_campaign',
  READING_WEEK: 'reading_week',
  HOMEWORK_CHALLENGE: 'homework_challenge',
  ATTENDANCE_WEEK: 'attendance_week',
  REFERRAL_BONUS: 'referral_bonus',
} as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[keyof typeof CAMPAIGN_TYPES];

export const CAMPAIGN_TARGET_AUDIENCES = ['all', 'children', 'parents', 'teachers'] as const;
export type CampaignTargetAudience = (typeof CAMPAIGN_TARGET_AUDIENCES)[number];

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'expired', 'cancelled'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_TYPES = [
  'point_conversion',
  'purchase',
  'gift',
  'refund',
  'wallet_adjustment',
  'reward_creation',
] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];
