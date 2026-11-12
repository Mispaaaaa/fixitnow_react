import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRoutes from './routes/v1/index.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin (curl, tests, service worker) are allowed.
      if (!origin || origin === env.clientUrl) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!env.isTest) app.use(morgan('dev'));
app.use(globalLimiter);

app.use(
  '/uploads',
  express.static(path.join(env.uploadsDir, 'public'), {
    maxAge: '7d',
    fallthrough: false,
  })
);

app.use('/api/v1', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;