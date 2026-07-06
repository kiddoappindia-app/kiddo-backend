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
import { swaggerSpec } from './docs/swagger.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kiddo-backend' });
});

app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    filter: true,
  },
}));
app.use('/api/v1/auth', authRoutes);
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

app.use(notFoundMiddleware);
app.use(errorMiddleware);
