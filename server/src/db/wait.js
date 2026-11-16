import sequelize from '../config/db.js';

const attempts = Number(process.env.DB_CONNECT_ATTEMPTS || 30);
const delayMs = Number(process.env.DB_CONNECT_DELAY_MS || 2000);

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await sequelize.authenticate();
    console.log('Database is reachable.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.log(`Waiting for database (${attempt}/${attempts}): ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

console.error('Database did not become reachable in time.');
await sequelize.close();
process.exit(1);
