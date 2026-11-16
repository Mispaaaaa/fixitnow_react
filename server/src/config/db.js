import { Sequelize } from 'sequelize';
import { env } from './env.js';

const dialectOptions = {
  charset: 'utf8mb4',
};

if (env.db.ssl) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: Boolean(env.db.sslCa),
  };
  if (env.db.sslCa) {
    dialectOptions.ssl.ca = env.db.sslCa.replace(/\\n/g, '\n');
  }
}

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00',
  define: {
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  dialectOptions,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

export default sequelize;