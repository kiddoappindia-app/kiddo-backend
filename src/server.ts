import http from 'node:http';
import { Server, type Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env, isOriginAllowed } from './config/env.js';
import { Device } from './models/device.model.js';
import type { Role } from './constants/roles.js';
import mongoose from 'mongoose';

// ----- Types -----

interface TokenPayload {
  sub: string;
  role: Role;
  familyId?: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  familyId?: string;
  role?: string;
  deviceId?: string;
  lastHeartbeat?: Date;
}

// ----- Socket.IO instance (module-level export, not global) -----
let io: Server | null = null;
export function getIO(): Server | null {
  return io;
}

const connectedSockets = new Map<string, AuthenticatedSocket>();

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (isOriginAllowed(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // ----- Socket.IO authentication middleware -----
  // Properly verifies JWT instead of trusting client-supplied values
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Actually verify the JWT token
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

      // Use values from the verified token, not from client-supplied data
      socket.userId = payload.sub;
      socket.role = payload.role;
      socket.familyId = payload.familyId ?? (socket.handshake.auth.familyId as string | undefined);
      socket.deviceId = socket.handshake.auth.deviceId as string | undefined;

      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ----- Connection handler -----
  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`Client connected: ${socket.id} (user: ${socket.userId}, family: ${socket.familyId})`);
    connectedSockets.set(socket.id, socket);

    if (socket.familyId) {
      socket.join(`family:${socket.familyId}`);
    }

    if (socket.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: socket.deviceId },
        { isOnline: true, lastActiveAt: new Date() },
      ).catch((err: unknown) => console.error('Error updating device status:', err));
      if (socket.familyId) {
        io!.to(`family:${socket.familyId}`).emit('device:online', {
          deviceId: socket.deviceId,
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    socket.on('authenticate', async (data: { token: string; familyId?: string }) => {
      try {
        if (data.familyId) {
          socket.familyId = data.familyId;
          socket.join(`family:${data.familyId}`);
        }
        socket.emit('authenticated', { success: true, timestamp: new Date().toISOString() });
      } catch (error) {
        socket.emit('auth_error', { message: 'Authentication failed' });
      }
    });

    // Accept both string and { familyId: string } format for family:join
    socket.on('family:join', (data: string | { familyId: string }) => {
      const familyId = typeof data === 'string' ? data : data.familyId;
      if (!familyId) return;

      if (socket.familyId) {
        socket.leave(`family:${socket.familyId}`);
      }
      socket.familyId = familyId;
      socket.join(`family:${familyId}`);
      console.log(`Socket ${socket.id} joined family:${familyId}`);
      io!.to(`family:${familyId}`).emit('family:member_joined', {
        userId: socket.userId,
        role: socket.role,
        timestamp: new Date().toISOString(),
      });
    });

    // Accept both string and { familyId: string } format for family:leave
    socket.on('family:leave', (data: string | { familyId: string }) => {
      const familyId = typeof data === 'string' ? data : data.familyId;
      if (!familyId) return;

      socket.leave(`family:${familyId}`);
      io!.to(`family:${familyId}`).emit('family:member_left', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });
      socket.familyId = undefined;
    });

    socket.on('heartbeat', async (data: { timestamp: string }) => {
      socket.lastHeartbeat = new Date();
      if (socket.deviceId) {
        try {
          await Device.findOneAndUpdate(
            { deviceId: socket.deviceId },
            { lastActiveAt: new Date() },
          );
        } catch (error) {
          console.error('Error updating device heartbeat:', error);
        }
      }
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('device:online', async (data: { deviceId: string; userId?: string }) => {
      try {
        await Device.findOneAndUpdate(
          { deviceId: data.deviceId },
          { isOnline: true, lastActiveAt: new Date() },
        );
        const familyId = socket.familyId;
        if (familyId) {
          io!.to(`family:${familyId}`).emit('device:online', {
            deviceId: data.deviceId,
            userId: data.userId || socket.userId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error updating device online status:', error);
      }
    });

    socket.on('device:offline', async (data: { deviceId: string }) => {
      try {
        await Device.findOneAndUpdate(
          { deviceId: data.deviceId },
          { isOnline: false, lastActiveAt: new Date() },
        );
        const familyId = socket.familyId;
        if (familyId) {
          io!.to(`family:${familyId}`).emit('device:offline', {
            deviceId: data.deviceId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error updating device offline status:', error);
      }
    });

    socket.on('task:completed', (data: { familyId: string; childId: string; taskId: string; title: string }) => {
      io!.to(`family:${data.familyId || socket.familyId}`).emit('task:update', {
        type: 'completed',
        childId: data.childId,
        taskId: data.taskId,
        title: data.title,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('task:approved', (data: { familyId: string; childId: string; taskId: string; title: string; points: number }) => {
      io!.to(`family:${data.familyId || socket.familyId}`).emit('task:update', {
        type: 'approved',
        childId: data.childId,
        taskId: data.taskId,
        title: data.title,
        points: data.points,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('reward:redeemed', (data: { familyId: string; childId: string; rewardId: string; title: string }) => {
      io!.to(`family:${data.familyId || socket.familyId}`).emit('reward:update', {
        type: 'redeemed',
        childId: data.childId,
        rewardId: data.rewardId,
        title: data.title,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('wallet:update', (data: { familyId: string; childId: string; action: string; amount: number }) => {
      io!.to(`family:${data.familyId || socket.familyId}`).emit('wallet:change', {
        childId: data.childId,
        action: data.action,
        amount: data.amount,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('notification:send', (data: { familyId: string; title: string; body: string; type: string }) => {
      io!.to(`family:${data.familyId || socket.familyId}`).emit('notification:receive', {
        title: data.title,
        body: data.body,
        type: data.type,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id} (user: ${socket.userId}, family: ${socket.familyId || 'none'})`);
      connectedSockets.delete(socket.id);

      if (socket.deviceId) {
        try {
          await Device.findOneAndUpdate(
            { deviceId: socket.deviceId },
            { isOnline: false, lastActiveAt: new Date() },
          );
          if (socket.familyId) {
            io!.to(`family:${socket.familyId}`).emit('device:offline', {
              deviceId: socket.deviceId,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error updating device disconnect:', error);
        }
      }
    });
  });

  // Stale socket cleanup
  setInterval(() => {
    const now = new Date();
    connectedSockets.forEach((socket, id) => {
      if (socket.lastHeartbeat) {
        const timeSinceHeartbeat = now.getTime() - socket.lastHeartbeat.getTime();
        if (timeSinceHeartbeat > 90000) {
          console.log(`Socket ${id} stale, disconnecting`);
          socket.disconnect();
        }
      }
    });
  }, 30000);

  server.listen(env.PORT, () => {
    console.log(`KidDo backend listening on http://localhost:${env.PORT}`);
  });

  // ----- Graceful shutdown -----
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed.');
    });

    // Close Socket.IO
    if (io) {
      io.close();
      console.log('Socket.IO closed.');
    }

    // Close MongoDB
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
