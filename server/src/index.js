import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import './models/index.js';
import { initSocket } from './sockets/index.js';
import { configurePush } from './services/push.service.js';
import { startJobs } from './jobs/index.js';

const server = http.createServer(app);
initSocket(server);
configurePush();

server.listen(env.port, () => {
  console.log(`FixitNow API listening on http://localhost:${env.port}/api/v1`);
  startJobs();
});

function shutdown(signal) {
  console.log(`\n${signal} received. Closing server...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));