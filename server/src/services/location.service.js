import { Op } from 'sequelize';
import { LocationShare } from '../models/index.js';
import { emitToUser } from '../sockets/registry.js';

const SHARE_DURATION_MS = 4 * 60 * 60 * 1000;

export function locationShareJSON(share) {
  if (!share) return null;
  return {
    id: share.id,
    requestId: share.requestId,
    userId: share.userId,
    lat: Number(share.lat),
    lng: Number(share.lng),
    mode: share.mode,
    expiresAt: share.expiresAt,
    stoppedAt: share.stoppedAt,
    updatedAt: share.updatedAt,
  };
}

export function findActiveLocationShare(requestId) {
  return LocationShare.findOne({
    where: {
      requestId,
      stoppedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['updatedAt', 'DESC']],
  });
}

export function emitLocationShare(request, share) {
  const payload = { requestId: request.id, location: locationShareJSON(share) };
  for (const userId of [request.customerId, request.technicianId]) {
    if (userId) emitToUser(userId, 'request:location', payload);
  }
}

export async function stopActiveLocationShare(request) {
  const share = await findActiveLocationShare(request.id);
  if (!share) return null;
  await share.update({ stoppedAt: new Date() });
  emitLocationShare(request, null);
  return share;
}

export async function createLocationShare(request, conversationId, userId, coordinates) {
  const existing = await findActiveLocationShare(request.id);
  if (existing) {
    await existing.update({ stoppedAt: new Date() });
  }
  const share = await LocationShare.create({
    conversationId,
    requestId: request.id,
    userId,
    ...coordinates,
    mode: 'live',
    expiresAt: new Date(Date.now() + SHARE_DURATION_MS),
  });
  emitLocationShare(request, share);
  return share;
}
