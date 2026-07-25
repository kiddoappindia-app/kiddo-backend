import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { RewardRule } from './models/reward-rule.model.js';
import { RewardCategory } from './models/reward-category.model.js';
import { RewardCampaign } from './models/reward-campaign.model.js';
import { RewardSettings } from './models/reward-settings.model.js';
import { Wallet } from './models/wallet.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kiddo';

const defaultRules = [
  { actionType: 'task_completed', name: 'Daily Task', basePoints: 50, frequency: 'unlimited' },
  { actionType: 'homework_completed', name: 'Homework', basePoints: 75, frequency: 'unlimited' },
  { actionType: 'learning_activity', name: 'Learning Activity', basePoints: 60, frequency: 'unlimited' },
  { actionType: 'teacher_assignment', name: 'Teacher Assignment', basePoints: 100, frequency: 'unlimited' },
  { actionType: 'parent_assignment', name: 'Parent Assignment', basePoints: 80, frequency: 'unlimited' },
  { actionType: 'quiz_completion', name: 'Quiz Completion', basePoints: 40, frequency: 'unlimited' },
  { actionType: 'puzzle_completion', name: 'Puzzle Completion', basePoints: 35, frequency: 'unlimited' },
  { actionType: 'game_achievement', name: 'Game Achievement', basePoints: 30, frequency: 'once_per_day' },
  { actionType: 'reading_goal', name: 'Reading Goal', basePoints: 50, frequency: 'once_per_day' },
  { actionType: 'habit_tracking', name: 'Habit Tracking', basePoints: 25, frequency: 'unlimited' },
  { actionType: 'attendance_reward', name: 'Attendance Reward', basePoints: 100, frequency: 'once_per_day' },
  { actionType: 'daily_login', name: 'Daily Login', basePoints: 20, frequency: 'once_per_day' },
  { actionType: 'weekly_streak', name: 'Weekly Streak', basePoints: 200, frequency: 'once_per_week' },
  { actionType: 'monthly_challenge', name: 'Monthly Challenge', basePoints: 500, frequency: 'once_per_month' },
  { actionType: 'parent_bonus', name: 'Parent Bonus', basePoints: 100, frequency: 'unlimited' },
  { actionType: 'teacher_bonus', name: 'Teacher Bonus', basePoints: 100, frequency: 'unlimited' },
  { actionType: 'admin_promotion', name: 'Admin Promotional Event', basePoints: 200, frequency: 'unlimited' },
  { actionType: 'conversion_to_coins', name: 'Point to Coin Conversion', basePoints: 0, frequency: 'unlimited', maxPerDay: 10, maxPerWeek: 50, maxPerMonth: 200 },
];

const defaultCategories = [
  { name: 'Hairstyles', slug: 'hairstyles', type: 'avatar_customization' as const, icon: '💇', sortOrder: 1 },
  { name: 'Shirts', slug: 'shirts', type: 'avatar_customization' as const, icon: '👕', sortOrder: 2 },
  { name: 'Pants', slug: 'pants', type: 'avatar_customization' as const, icon: '👖', sortOrder: 3 },
  { name: 'Dresses', slug: 'dresses', type: 'avatar_customization' as const, icon: '👗', sortOrder: 4 },
  { name: 'Shoes', slug: 'shoes', type: 'avatar_customization' as const, icon: '👟', sortOrder: 5 },
  { name: 'Hats', slug: 'hats', type: 'avatar_customization' as const, icon: '🧢', sortOrder: 6 },
  { name: 'Glasses', slug: 'glasses', type: 'avatar_customization' as const, icon: '👓', sortOrder: 7 },
  { name: 'Backpacks', slug: 'backpacks', type: 'avatar_customization' as const, icon: '🎒', sortOrder: 8 },
  { name: 'Watches', slug: 'watches', type: 'avatar_customization' as const, icon: '⌚', sortOrder: 9 },
  { name: 'Accessories', slug: 'accessories', type: 'avatar_customization' as const, icon: '💍', sortOrder: 10 },
  { name: 'Wings', slug: 'wings', type: 'avatar_customization' as const, icon: '🪽', sortOrder: 11 },
  { name: 'Pets', slug: 'pets', type: 'avatar_customization' as const, icon: '🐾', sortOrder: 12 },
  { name: 'Animated Effects', slug: 'animated-effects', type: 'avatar_customization' as const, icon: '✨', sortOrder: 13 },
  { name: 'Special Emotes', slug: 'special-emotes', type: 'avatar_customization' as const, icon: '😊', sortOrder: 14 },
  { name: 'Sticker Packs', slug: 'sticker-packs', type: 'goodies' as const, icon: '🖼️', sortOrder: 15 },
  { name: 'Wallpapers', slug: 'wallpapers', type: 'goodies' as const, icon: '🖥️', sortOrder: 16 },
  { name: 'Story Books', slug: 'story-books', type: 'goodies' as const, icon: '📚', sortOrder: 17 },
  { name: 'Coloring Books', slug: 'coloring-books', type: 'goodies' as const, icon: '🎨', sortOrder: 18 },
  { name: 'Learning Packs', slug: 'learning-packs', type: 'goodies' as const, icon: '📖', sortOrder: 19 },
  { name: 'Achievement Badges', slug: 'achievement-badges', type: 'goodies' as const, icon: '🏅', sortOrder: 20 },
  { name: 'Printable Certificates', slug: 'printable-certificates', type: 'goodies' as const, icon: '📜', sortOrder: 21 },
  { name: 'Treats & Snacks', slug: 'treats-snacks', type: 'physical_rewards' as const, icon: '🍪', sortOrder: 22 },
  { name: 'Activities & Outings', slug: 'activities-outings', type: 'physical_rewards' as const, icon: '🎡', sortOrder: 23 },
  { name: 'Screen Time', slug: 'screen-time', type: 'physical_rewards' as const, icon: '📱', sortOrder: 24 },
  { name: 'Toys & Gifts', slug: 'toys-gifts', type: 'physical_rewards' as const, icon: '🎁', sortOrder: 25 },
  { name: 'Family Time', slug: 'family-time', type: 'physical_rewards' as const, icon: '👨‍👩‍👧‍👦', sortOrder: 26 },
];

async function seedRewardEconomy() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminUser = await mongoose.connection.db
    ?.collection('users')
    .findOne({ role: 'admin' });

  if (!adminUser) {
    console.log('No admin user found. Run seedAdmin.ts first.');
    await mongoose.disconnect();
    return;
  }

  const adminId = adminUser._id;

  // Seed global reward settings
  const defaultSettings = [
    { key: 'conversion_ratio', value: 1000, description: 'Reward Points needed for 1 Redeem Coin' },
    { key: 'min_conversion_points', value: 1000, description: 'Minimum Reward Points per conversion' },
    { key: 'max_daily_conversions', value: 10, description: 'Maximum conversions per day' },
    { key: 'max_weekly_conversions', value: 50, description: 'Maximum conversions per week' },
    { key: 'max_monthly_conversions', value: 200, description: 'Maximum conversions per month' },
  ];

  for (const setting of defaultSettings) {
    const existing = await RewardSettings.findOne({ key: setting.key });
    if (!existing) {
      await RewardSettings.create(setting);
      console.log(`Created reward setting: ${setting.key} = ${setting.value}`);
    }
  }

  // Ensure every existing child has a wallet
  const childrenWithoutWallets = await mongoose.connection.db
    ?.collection('users')
    .find({ role: 'child', _id: { $nin: await Wallet.distinct('childId') } })
    .toArray();

  if (childrenWithoutWallets && childrenWithoutWallets.length > 0) {
    const walletDocs = childrenWithoutWallets.map((child) => ({
      childId: child._id,
      rewardPoints: child.points ?? 0,
    }));
    await Wallet.insertMany(walletDocs);
    console.log(`Created wallets for ${walletDocs.length} existing children`);
  }

  for (const rule of defaultRules) {
    const existing = await RewardRule.findOne({ actionType: rule.actionType });
    if (!existing) {
      await RewardRule.create({
        ...rule,
        description: `Points awarded for ${rule.name.toLowerCase()}`,
        isActive: true,
        maxPerDay: rule.maxPerDay ?? 0,
        maxPerWeek: rule.maxPerWeek ?? 0,
        maxPerMonth: rule.maxPerMonth ?? 0,
        applicableRoles: ['child'],
        createdBy: adminId,
        updatedBy: adminId,
      });
      console.log(`Created reward rule: ${rule.name}`);
    } else {
      console.log(`Reward rule already exists: ${rule.name}`);
    }
  }

  for (const cat of defaultCategories) {
    const existing = await RewardCategory.findOne({ slug: cat.slug });
    if (!existing) {
      await RewardCategory.create({ ...cat, description: '', isActive: true });
      console.log(`Created category: ${cat.name}`);
    } else {
      console.log(`Category already exists: ${cat.name}`);
    }
  }

  const existingCampaigns = await RewardCampaign.countDocuments();
  if (existingCampaigns === 0) {
    const now = new Date();
    await RewardCampaign.create({
      name: 'Welcome Bonus',
      description: 'Double points for all activities during first week',
      type: 'promotional',
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      bonusPointsMultiplier: 2.0,
      bonusCoinsMultiplier: 1.0,
      isActive: true,
      createdBy: adminId,
    });
    console.log('Created Welcome Bonus campaign');
  }

  console.log('Reward economy seed complete!');
  await mongoose.disconnect();
}

seedRewardEconomy().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
