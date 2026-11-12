import { Op } from 'sequelize';
import { LocationShare } from '../models/index.js';

let available = true;

/** The only hard delete in the system: privacy cleanup for location shares. */
export async function purgeExpiredShares() {
  if (!available) return 0;
  try {
    const deleted = await LocationShare.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.ne]: null, [Op.lt]: new Date() } },
          { stoppedAt: { [Op.ne]: null } },
        ],
      },
      force: true,
    });
    return deleted;
  } catch {
    // Table may not exist yet during phase 1; disable quietly for this process.
    available = false;
    return 0;
  }
}