import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

export const rateLimiterMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  handler: (req, res) => {
    logger.warn(
      {
        ip: req.ip,
        path: req.path,
      },
      'Rate limit exceeded'
    );
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
  skip: (req) => {
    return req.path === '/health';
  },
});
