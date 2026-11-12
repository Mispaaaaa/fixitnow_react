/**
 * Single shared helper for user-facing deletes: records who deleted the row and
 * lets Sequelize paranoid mode hide it. Nothing is physically removed.
 */
export async function softDeleteRecord(instance, actorId, options = {}) {
  if (!instance) return null;
  await instance.update({ deletedBy: actorId }, options);
  await instance.destroy(options);
  return instance;
}

/** Restores a soft-deleted row and clears deletedBy. */
export async function restoreRecord(model, id, options = {}) {
  const instance = await model.findByPk(id, { paranoid: false, ...options });
  if (!instance) return null;
  await instance.restore(options);
  await instance.update({ deletedBy: null }, options);
  return instance;
}

/** Whitelisted models that the admin archive page can browse and restore. */
export const ARCHIVE_MODELS = {
  users: 'User',
  requests: 'ServiceRequest',
  categories: 'ServiceCategory',
  reviews: 'Review',
  technicians: 'TechnicianProfile',
  announcements: 'Announcement',
  messages: 'Message',
  conversations: 'Conversation',
  'saved-addresses': 'SavedAddress',
};