import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(
    {
      port: config.port,
      nodeEnv: config.nodeEnv,
      logLevel: config.logLevel,
      innertubeConfigured: !!config.innertube.apiKey,
    },
    `Server started on port ${config.port}`
  );
});

const gracefulShutdown = (signal: string): void => {
  logger.info({ signal }, 'Received shutdown signal, closing server gracefully');

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error: Error) => {
  logger.error({ err: error }, 'Uncaught exception');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export { server };
