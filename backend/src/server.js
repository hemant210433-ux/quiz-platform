import config from './config/index.js';
import { createApp } from './app.js';
import { initStorage, closeStorage, describeStorage } from './storage/jsonStorage.js';
import { bootstrapAdminFromEnv, getAdmin } from './services/authService.js';
import logger from './utils/logger.js';

async function main() {
  await initStorage();
  const boot = await bootstrapAdminFromEnv();
  if (boot.created) logger.info('Admin account created from ADMIN_USERNAME / ADMIN_PASSWORD.');
  if (!(await getAdmin())) {
    logger.warn('No admin account exists yet. Run "npm run setup-admin" or set ADMIN_USERNAME and ADMIN_PASSWORD, then restart.');
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`Quiz Platform API listening on http://localhost:${config.port} (${config.env})`);
    logger.info(`Storage: ${describeStorage()}`);
    if (config.serveFrontend) logger.info(`Serving frontend from ${config.frontendDist}`);
  });

  const shutdown = (sig) => {
    logger.info(`${sig} received, shutting down…`);
    server.close(() => closeStorage().finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
