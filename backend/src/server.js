require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const Sentry = require('@sentry/node');
const newrelic = require('newrelic');

// Import monitoring and logging utilities
const logger = require('./utils/logger');
const { prometheusMiddleware, metricsEndpoint } = require('./monitoring/prometheus');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestTracer } = require('./middleware/requestTracer');
const { healthCheck } = require('./routes/health');
const { analyticsRouter } = require('./routes/analytics');
const { authRouter } = require('./routes/auth');
const { userRouter } = require('./routes/user');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE || 1.0,
  beforeSend(event, hint) {
    // Filter out health check errors in production
    if (process.env.NODE_ENV === 'production' && 
        event.request?.url?.includes('/health')) {
      return null;
    }
    return event;
  },
});

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: 500 // add 500ms delay per request after delayAfter
});
app.use('/api/', speedLimiter);

// Logging middleware
app.use(morgan('combined', { 
  stream: { write: message => logger.info('HTTP Request', { message: message.trim() }) }
}));

// Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Prometheus metrics
app.use(prometheusMiddleware);

// Request tracing
app.use(requestTracer);

// Health check endpoint (before authentication)
app.get('/health', healthCheck);

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// API routes
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// Custom error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;