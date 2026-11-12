import { AuditLog } from '../models/index.js';
import { stripSecretFields } from './serialize.js';

/** Records an admin edit with before/after snapshots. */
export async function logAudit({
  actorId,
  action,
  entityType,
  entityId = null,
  before = null,
  after = null,
  ip = null,
  transaction = undefined,
}) {
  return AuditLog.create(
    {
      actorId,
      action,
      entityType,
      entityId,
      before: before ? stripSecretFields(before) : null,
      after: after ? stripSecretFields(after) : null,
      ip,
    },
    { transaction }
  );
}