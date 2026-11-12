import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import sequelize from '../config/db.js';
import '../models/index.js';

fs.mkdirSync(path.join(env.uploadsDir, 'public'), { recursive: true });
fs.mkdirSync(path.join(env.uploadsDir, 'private', 'documents'), { recursive: true });

const force = process.argv.includes('--force');

try {
  await sequelize.authenticate();
  console.log(`Connected to ${env.db.name} (MariaDB/MySQL).`);
  await sequelize.sync({ force });
  console.log(force ? 'Database recreated.' : 'Tables are up to date.');
} catch (error) {
  console.error('Database sync failed:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}