import { Op } from 'sequelize';
import { ServiceRequest } from '../models/index.js';
import { notifyUser } from '../services/notification.service.js';

function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Notifies both parties when an accepted/in-progress job starts within the next
 * hour. `reminder_sent_at` guards against duplicate notifications.
 */
export async function sendJobReminders() {
  try {
    const now = new Date();
    const today = todayLocal();
    const requests = await ServiceRequest.findAll({
      where: {
        status: { [Op.in]: ['accepted', 'on_the_way'] },
        preferredDate: today,
        reminderSentAt: null,
        technicianId: { [Op.ne]: null },
      },
    });

    let sent = 0;
    for (const request of requests) {
      const startHour = Number(request.timeSlot.split(':')[0]);
      const start = new Date(`${request.preferredDate}T${String(startHour).padStart(2, '0')}:00:00`);
      const minutesUntil = (start.getTime() - now.getTime()) / 60000;
      if (minutesUntil > 0 && minutesUntil <= 60) {
        const title = 'Job starts in about an hour';
        const body = `${request.issueDescription.slice(0, 80)} at ${request.address.slice(0, 60)}`;
        await Promise.all([
          notifyUser({
            userId: request.customerId,
            type: 'job_reminder',
            title,
            body,
            data: { requestId: request.id, url: `/requests/${request.id}` },
          }),
          notifyUser({
            userId: request.technicianId,
            type: 'job_reminder',
            title,
            body,
            data: { requestId: request.id, url: `/requests/${request.id}` },
          }),
        ]);
        request.reminderSentAt = new Date();
        await request.save();
        sent += 1;
      }
    }
    return sent;
  } catch (error) {
    console.error('Job reminder scan failed:', error.message);
    return 0;
  }
}
