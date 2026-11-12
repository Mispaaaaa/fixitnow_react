// In-memory presence registry. Each user may have several tabs/devices open.
const connections = new Map();

export function addConnection(userId, socketId) {
  const key = String(userId);
  const sockets = connections.get(key) || new Set();
  sockets.add(socketId);
  connections.set(key, sockets);
  return sockets.size === 1;
}

export function removeConnection(userId, socketId) {
  const key = String(userId);
  const sockets = connections.get(key);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    connections.delete(key);
    return true;
  }
  return false;
}

export function isOnline(userId) {
  return connections.has(String(userId));
}

export function onlineUserIds() {
  return [...connections.keys()].map(Number);
}