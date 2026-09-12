import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import './types/express.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import rewardRoutes from './routes/reward.routes.js';
import userRoutes from './routes/user.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import gameRoutes from './routes/game.routes.js';
import activityRoutes from './routes/activity.routes.js';
import shopRoutes from './routes/shop.routes.js';
import powerupRoutes from './routes/powerup.routes.js';
import interactionRoutes from './routes/interaction.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import moodRoutes from './routes/mood.routes.js';
import issueRoutes from './routes/issue.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import avatarRoutes from './routes/avatar.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import rewardStoreRoutes from './routes/reward-store.routes.js';
import rewardAdminRoutes from './routes/reward-admin.routes.js';
import managementRoutes from './routes/management.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import wakeUpRoutes from './routes/wake-up.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import pairingRoutes from './routes/pairing.routes.js';
import deviceRoutes from './routes/device.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import syncRoutes from './routes/sync.routes.js';
import presenceRoutes from './routes/presence.routes.js';
import taskEngineRoutes from './routes/task-engine.routes.js';
import taskTemplateRoutes from './routes/task-template.routes.js';
import walletEngineRoutes from './routes/wallet-engine.routes.js';
import storeEngineRoutes from './routes/store-engine.routes.js';
import gamificationEngineRoutes from './routes/gamification-engine.routes.js';
import petEngineRoutes from './routes/pet-engine.routes.js';
import virtualHomeRoutes from './routes/virtual-home.routes.js';
import seasonalEventRoutes from './routes/seasonal-event.routes.js';
import worldMapRoutes from './routes/world-map.routes.js';
import dailyJourneyRoutes from './routes/daily-journey.routes.js';
import parentControlsRoutes from './routes/parent-controls.routes.js';
import schoolStructureRoutes from './routes/school-structure.routes.js';
import assignmentEngineRoutes from './routes/assignment-engine.routes.js';
import attendanceEngineRoutes from './routes/attendance-engine.routes.js';
import announcementEngineRoutes from './routes/announcement-engine.routes.js';
import messageEngineRoutes from './routes/message-engine.routes.js';
import schoolRewardEngineRoutes from './routes/school-reward-engine.routes.js';
import teacherAnalyticsRoutes from './routes/teacher-analytics.routes.js';
import intelligenceRoutes from './routes/intelligence.routes.js';
import remoteConfigRoutes from './routes/remote-config.routes.js';
import contentRoutes from './routes/content.routes.js';
import eventConfigRoutes from './routes/event-config.routes.js';
import rewardConfigRoutes from './routes/reward-config.routes.js';
import featureFlagRoutes from './routes/feature-flag.routes.js';
import announcementCmsRoutes from './routes/announcement-cms.routes.js';
import experimentRoutes from './routes/experiment.routes.js';
import localizationRoutes from './routes/localization.routes.js';
import accessibilityRoutes from './routes/accessibility.routes.js';
import analyticsOpsRoutes from './routes/analytics-ops.routes.js';
import mediaRoutes from './routes/media.routes.js';
import contentVersionRoutes from './routes/content-version.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import { swaggerSpec } from './docs/swagger.js';
import { swaggerPortalCss, swaggerPortalFavicon, swaggerPortalJs, swaggerPortalOptions } from './docs/swagger-portal.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import { apiLimiter, authLimiter } from './middlewares/rate-limit.middleware.js';
import { isOriginAllowed } from './config/env.js';
import mongoose from 'mongoose';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'up' : 'down';
  res.status(dbStatus === 'up' ? 200 : 503).json({
    status: dbStatus === 'up' ? 'ok' : 'error',
    service: 'kiddo-backend',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.get('/api-docs/kiddo-portal.css', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.type('text/css').send(swaggerPortalCss);
});

app.get('/api-docs/kiddo-portal.js', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.type('application/javascript').send(swaggerPortalJs);
});

app.get('/api-docs/kiddo-favicon.svg', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('image/svg+xml').send(swaggerPortalFavicon);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerPortalOptions));
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/rewards', rewardRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/powerups', powerupRoutes);
app.use('/api/v1/interactions', interactionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/moods', moodRoutes);
app.use('/api/v1/issues', issueRoutes);
app.use('/api/v1/teacher', teacherRoutes);
app.use('/api/v1/avatar', avatarRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/store', rewardStoreRoutes);
app.use('/api/v1/admin/economy', rewardAdminRoutes);
app.use('/api/v1/management', managementRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/wake-up', wakeUpRoutes);
app.use('/api/v1/gamification', gamificationRoutes);
app.use('/api/v1/pairing', pairingRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/presence', presenceRoutes);
app.use('/api/v1/tasks/v2', taskEngineRoutes);
app.use('/api/v1/task-templates', taskTemplateRoutes);
app.use('/api/v1/wallet/v2', walletEngineRoutes);
app.use('/api/v1/store/v2', storeEngineRoutes);
app.use('/api/v1/gamification/v2', gamificationEngineRoutes);
app.use('/api/v1/pets', petEngineRoutes);
app.use('/api/v1/virtual-home', virtualHomeRoutes);
app.use('/api/v1/events', seasonalEventRoutes);
app.use('/api/v1/world', worldMapRoutes);
app.use('/api/v1/daily-journey', dailyJourneyRoutes);
app.use('/api/v1/parent-controls', parentControlsRoutes);
app.use('/api/v1/school', schoolStructureRoutes);
app.use('/api/v1/assignments', assignmentEngineRoutes);
app.use('/api/v1/attendance', attendanceEngineRoutes);
app.use('/api/v1/announcements', announcementEngineRoutes);
app.use('/api/v1/messages', messageEngineRoutes);
app.use('/api/v1/school-rewards', schoolRewardEngineRoutes);
app.use('/api/v1/teacher-analytics', teacherAnalyticsRoutes);
app.use('/api/v1/intelligence', intelligenceRoutes);
app.use('/api/v1/remote-config', remoteConfigRoutes);
app.use('/api/v1/cms', contentRoutes);
app.use('/api/v1/event-config', eventConfigRoutes);
app.use('/api/v1/reward-config', rewardConfigRoutes);
app.use('/api/v1/feature-flags', featureFlagRoutes);
app.use('/api/v1/announcements-cms', announcementCmsRoutes);
app.use('/api/v1/experiments', experimentRoutes);
app.use('/api/v1/localization', localizationRoutes);
app.use('/api/v1/accessibility', accessibilityRoutes);
app.use('/api/v1/analytics-ops', analyticsOpsRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/content-versions', contentVersionRoutes);
app.use('/api/v1/moderation', moderationRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
