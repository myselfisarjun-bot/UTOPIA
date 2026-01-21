const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logger.trackError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
  });

  // Send error to Sentry
  Sentry.captureException(err, {
    tags: {
      url: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode,
    },
    extra: {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestBody: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    },
  });

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production error response
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = 'Invalid resource ID';
      error = new AppError(message, 400);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      const message = `Invalid input data: ${errors.join('. ')}`;
      error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token';
      error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Token expired';
      error = new AppError(message, 401);
    }

    // Database connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
      const message = 'Database connection error';
      error = new AppError(message, 503);
    }

    // Rate limit errors
    if (err.statusCode === 429) {
      const message = 'Too many requests, please try again later';
      error = new AppError(message, 429);
    }

    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
};

// Handle 404 errors
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Security error handler
const securityErrorHandler = (errorType, req, res, next) => {
  logger.trackSecurityEvent(errorType, 'high', 'external', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const error = new AppError('Security violation detected', 403);
  next(error);
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  logger.trackSecurityEvent('rate_limit_violation', 'medium', 'external', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(429).json({
    status: 'error',
    message: 'Too many requests from this IP',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000),
  });
};

// Database error handler
const databaseErrorHandler = (error, req, res, next) => {
  logger.trackError(error, {
    context: 'database_operation',
    url: req.originalUrl,
    userId: req.user?.id,
  });

  let statusCode = 500;
  let message = 'Database operation failed';

  if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate entry';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  const appError = new AppError(message, statusCode);
  next(appError);
};

// Validation error handler
const validationErrorHandler = (error, req, res, next) => {
  if (error.isJoi) {
    const message = error.details.map(detail => detail.message).join(', ');
    const appError = new AppError(message, 400);
    return next(appError);
  }
  next(error);
};

module.exports = {
  AppError,
  catchAsync,
  errorHandler,
  notFoundHandler,
  securityErrorHandler,
  rateLimitHandler,
  databaseErrorHandler,
  validationErrorHandler,
};