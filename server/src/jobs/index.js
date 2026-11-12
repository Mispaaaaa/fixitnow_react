let timers = [];

/**
 * Background jobs are deliberately simple intervals so they can be explained
 * in the oral defense: expire location shares and send 1-hour job reminders.
 */
export function startJobs() {
  stopJobs();
  // Imported lazily so the API can boot even before the chat/location module is
  // present during early development phases.
  Promise.all([import('./locationPurge.js'), import('./jobReminder.js')])
    .then(([locationPurge, jobReminder]) => {
      timers = [
        setInterval(() => locationPurge.purgeExpiredShares(), 60 * 1000),
        setInterval(() => jobReminder.sendJobReminders(), 60 * 1000),
      ];
      timers.forEach((timer) => timer.unref?.());
      locationPurge.purgeExpiredShares().catch(() => {});
      jobReminder.sendJobReminders().catch(() => {});
    })
    .catch((error) => console.warn('Background jobs not started:', error.message));
}

export function stopJobs() {
  timers.forEach((timer) => clearInterval(timer));
  timers = [];
}