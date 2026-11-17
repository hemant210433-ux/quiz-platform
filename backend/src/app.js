import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { exists } from './storage/jsonStorage.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import importRoutes from './routes/importRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { requireAdmin, requireCsrfHeader } from './middleware/authMiddleware.js';
import { publicLimiter, adminLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) {
    const tp = config.trustProxy;
    app.set('trust proxy', /^\d+$/.test(tp) ? Number(tp) : tp === 'true' ? true : tp);
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS is only needed when the frontend runs on a different origin.
  app.use(
    '/api',
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // same-origin / curl
        cb(null, config.corsOrigins.includes(origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-Requested-With', 'X-Attempt-Token'],
      maxAge: 600,
    }),
  );
  app.use(cookieParser());

  app.get('/api/health', async (req, res) => {
    try {
      await exists('settings.json'); // also proves the database connection works
      res.json({ status: 'ok', time: new Date().toISOString(), uptimeSeconds: Math.round(process.uptime()) });
    } catch (err) {
      res.status(503).json({ status: 'error', message: 'Storage unavailable' });
    }
  });

  app.use('/api/auth', express.json({ limit: '50kb' }), authRoutes);

  app.use('/api/public', publicLimiter, express.json({ limit: '1mb' }), publicRoutes);

  app.use(
    '/api/admin',
    adminLimiter,
    express.json({ limit: '30mb' }),
    requireCsrfHeader,
    requireAdmin,
    (req, res, next) => {
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
    quizRoutes,
    importRoutes,
    resultRoutes,
  );

  app.use('/api', notFoundHandler);

  // Serve the built frontend (single-origin deployment). The data directory is never served.
  if (config.serveFrontend && fs.existsSync(path.join(config.frontendDist, 'index.html'))) {
    app.use(express.static(config.frontendDist, { index: false, maxAge: '1h', dotfiles: 'deny' }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.frontendDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
