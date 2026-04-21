import app from './app';
import { env } from './config/env';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './shared/logger';

async function start() {
  try {
    await connectDB();
    await connectRedis();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 TechMart API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

start();
