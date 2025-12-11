import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();

  const logRequestStart = (): void => {
    logger.info(
      {
        req: {
          id: req.id,
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
        },
      },
      'Incoming request'
    );
  };

  const logRequestEnd = (): void => {
    const duration = Date.now() - req.startTime;
    const logData = {
      req: {
        id: req.id,
        method: req.method,
        url: req.url,
      },
      res: {
        statusCode: res.statusCode,
      },
      duration,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request completed with server error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed with client error');
    } else {
      logger.info(logData, 'Request completed');
    }
  };

  logRequestStart();
  res.on('finish', logRequestEnd);
  res.on('close', () => {
    if (!res.writableEnded) {
      logger.warn(
        {
          req: {
            id: req.id,
            method: req.method,
            url: req.url,
          },
        },
        'Request closed before response finished'
      );
    }
  });

  next();
};
