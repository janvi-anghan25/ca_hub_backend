import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

let io = null;

/**
 * Initialize Socket.io server attached to the HTTP server.
 * Rooms are task-scoped: `task:<taskId>`
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  // ── JWT Auth Middleware ─────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role office isActive').lean();
      if (!user || !user.isActive) return next(new Error('User not found or inactive'));

      socket.user = { ...user, id: user._id.toString() };
      next();
    } catch (err) {
      logger.warn('[Socket] Auth failed:', err.message);
      next(new Error('Invalid token'));
    }
  });

  // ── Connection Handler ──────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`[Socket] Connected: ${socket.user.name} (${socket.user.id})`);

    // Join a specific task discussion room
    socket.on('task:join', (taskId) => {
      if (!taskId) return;
      socket.join(`task:${taskId}`);
      logger.info(`[Socket] ${socket.user.name} joined room task:${taskId}`);
    });

    // Leave a task discussion room
    socket.on('task:leave', (taskId) => {
      if (!taskId) return;
      socket.leave(`task:${taskId}`);
    });

    // Typing indicator: broadcast to other room members
    socket.on('task:typing', ({ taskId, isTyping }) => {
      if (!taskId) return;
      socket.to(`task:${taskId}`).emit('task:typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] Disconnected: ${socket.user.name}`);
    });
  });

  logger.info('[Socket] Socket.io server initialized');
  return io;
};

/**
 * Get the Socket.io instance.
 */
export const getIO = () => io;

/**
 * Emit a new comment event to all members in a task room.
 * Called from taskService after persisting the comment.
 */
export const emitNewComment = (taskId, comment) => {
  if (!io) return;
  io.to(`task:${taskId}`).emit('task:newComment', comment);
};
