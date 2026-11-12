import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { setIo } from './registry.js';
import { addConnection, removeConnection } from './presence.js';

export function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
    // Forced WebSocket transport per the school requirement.
    transports: ['websocket'],
  });
  setIo(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, env.jwt.accessSecret);
      const user = await User.findByPk(payload.sub);
      if (!user || !user.isActive) return next(new Error('Account is not active'));
      socket.user = { id: user.id, role: user.role, name: user.name };
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    const cameOnline = addConnection(userId, socket.id);
    await User.update({ lastActiveAt: new Date() }, { where: { id: userId } }).catch(() => {});

    if (cameOnline) {
      socket.broadcast.emit('presence:update', { userId, online: true });
    }

    socket.on('disconnect', async () => {
      const wentOffline = removeConnection(userId, socket.id);
      if (wentOffline) {
        const lastActiveAt = new Date();
        await User.update({ lastActiveAt }, { where: { id: userId } }).catch(() => {});
        socket.broadcast.emit('presence:update', { userId, online: false, lastActiveAt });
      }
    });
  });

  return io;
}