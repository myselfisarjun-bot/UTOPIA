import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import { logger } from '../utils/logger';

interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    requestId: string;
    stack?: string;
  };
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;

  const errorLog = {
    err: {
      message: err.message,
      stack: err.stack,
      statusCode,
      isOperational,
    },
    req: {
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
  };

  if (!isOperational || statusCode >= 500) {
    logger.error(errorLog, 'Unhandled error');
  } else {
    logger.warn(errorLog, 'Operational error');
  }

  const response: ErrorResponse = {
    error: {
      message: isOperational ? err.message : 'Internal server error',
      statusCode,
      requestId: req.id,
    },
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(
    {
      req: {
        id: req.id,
        method: req.method,
        url: req.url,
      },
    },
    'Route not found'
  );

  res.status(404).json({
    error: {
      message: 'Route not found',
      statusCode: 404,
      requestId: req.id,
    },
  });
};
