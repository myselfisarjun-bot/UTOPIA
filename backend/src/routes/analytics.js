const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const { traceBusinessOperation } = require('../middleware/requestTracer');
const logger = require('../utils/logger');
const { trackAnalyticsEvent, trackFeatureUsage } = require('../monitoring/prometheus');

const router = express.Router();

// Track custom event
router.post('/events', [
  body('eventName').notEmpty().withMessage('Event name is required'),
  body('properties').optional().isObject(),
  body('userId').optional().isString(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { eventName, properties = {}, userId = null } = req.body;
  const trace = traceBusinessOperation('track_analytics_event', userId);

  try {
    // Log the event
    logger.trackEvent(eventName, {
      ...properties,
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Track in Prometheus
    trackAnalyticsEvent(eventName, 'backend');

    // Track feature usage if applicable
    if (properties.feature) {
      trackFeatureUsage(properties.feature, userId ? 'authenticated' : 'anonymous');
    }

    trace.complete({ eventName, properties });

    res.json({
      status: 'success',
      message: 'Event tracked successfully',
      eventName
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Track user action
router.post('/user-action', [
  body('action').notEmpty().withMessage('Action is required'),
  body('details').optional().isObject(),
  body('userId').optional().isString(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { action, details = {}, userId = null } = req.body;
  const trace = traceBusinessOperation('track_user_action', userId);

  try {
    logger.trackUserAction(userId, action, {
      ...details,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete({ action, details });

    res.json({
      status: 'success',
      message: 'User action tracked successfully',
      action
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Get analytics summary
router.get('/summary', [
  query('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period'),
  query('metrics').optional().isString(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { period = '24h', metrics = 'all' } = req.query;
  const trace = traceBusinessOperation('get_analytics_summary');

  try {
    // This would typically query a database or analytics service
    // For now, we'll return mock data
    const summary = {
      period,
      timestamp: new Date().toISOString(),
      metrics: {
        totalRequests: Math.floor(Math.random() * 10000),
        uniqueUsers: Math.floor(Math.random() * 1000),
        errorRate: Math.random() * 0.1,
        avgResponseTime: Math.random() * 500 + 100,
        topEvents: [
          { name: 'user_login', count: 1250 },
          { name: 'page_view', count: 3400 },
          { name: 'feature_used', count: 890 },
        ],
        userActions: {
          login: 1250,
          logout: 1180,
          profile_update: 340,
          settings_change: 150,
        }
      }
    };

    logger.trackEvent('analytics_summary_requested', {
      period,
      metrics,
      userId: req.user?.id,
    });

    trace.complete({ period, metrics });

    res.json({
      status: 'success',
      data: summary
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Get performance metrics
router.get('/performance', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('get_performance_metrics');

  try {
    const performance = {
      timestamp: new Date().toISOString(),
      api: {
        avgResponseTime: Math.random() * 200 + 50,
        slowestEndpoints: [
          { endpoint: '/api/users/profile', avgTime: 450 },
          { endpoint: '/api/analytics/summary', avgTime: 380 },
          { endpoint: '/api/auth/login', avgTime: 320 },
        ],
        errorRate: Math.random() * 0.05,
        throughput: Math.floor(Math.random() * 1000) + 500,
      },
      database: {
        avgQueryTime: Math.random() * 100 + 20,
        slowQueries: Math.floor(Math.random() * 10),
        connectionPool: {
          active: Math.floor(Math.random() * 10),
          idle: Math.floor(Math.random() * 20),
          max: 30,
        }
      },
      cache: {
        hitRate: Math.random() * 0.3 + 0.7,
        misses: Math.floor(Math.random() * 50),
        hits: Math.floor(Math.random() * 200) + 100,
      }
    };

    res.json({
      status: 'success',
      data: performance
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Get error analytics
router.get('/errors', [
  query('period').optional().isIn(['1h', '24h', '7d', '30d']),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
], catchAsync(async (req, res) => {
  const { period = '24h', severity } = req.query;
  const trace = traceBusinessOperation('get_error_analytics');

  try {
    const errorAnalytics = {
      period,
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: Math.floor(Math.random() * 100),
        uniqueErrors: Math.floor(Math.random() * 20),
        errorRate: Math.random() * 0.1,
        resolvedErrors: Math.floor(Math.random() * 80),
        newErrors: Math.floor(Math.random() * 20),
      },
      errors: [
        {
          id: 'err_001',
          message: 'Database connection timeout',
          count: 15,
          severity: 'high',
          lastOccurrence: new Date().toISOString(),
          endpoints: ['/api/users', '/api/posts'],
        },
        {
          id: 'err_002',
          message: 'Validation error',
          count: 8,
          severity: 'medium',
          lastOccurrence: new Date().toISOString(),
          endpoints: ['/api/auth/login'],
        },
        {
          id: 'err_003',
          message: 'Rate limit exceeded',
          count: 25,
          severity: 'low',
          lastOccurrence: new Date().toISOString(),
          endpoints: ['/api/analytics/events'],
        },
      ]
    };

    res.json({
      status: 'success',
      data: errorAnalytics
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Real-time metrics endpoint
router.get('/realtime', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('get_realtime_metrics');

  try {
    const realtime = {
      timestamp: new Date().toISOString(),
      requests: {
        currentRPS: Math.floor(Math.random() * 50) + 10,
        avgResponseTime: Math.random() * 200 + 50,
        activeConnections: Math.floor(Math.random() * 20) + 5,
      },
      system: {
        cpuUsage: Math.random() * 50 + 10,
        memoryUsage: Math.random() * 60 + 20,
        diskUsage: Math.random() * 40 + 10,
      },
      errors: {
        currentErrorRate: Math.random() * 0.05,
        errorsInLastMinute: Math.floor(Math.random() * 5),
      }
    };

    res.json({
      status: 'success',
      data: realtime
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Export analytics data
router.post('/export', [
  body('format').optional().isIn(['json', 'csv', 'pdf']),
  body('period').optional().isIn(['1h', '24h', '7d', '30d', '90d']),
  body('metrics').optional().isArray(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { format = 'json', period = '24h', metrics = [] } = req.body;
  const trace = traceBusinessOperation('export_analytics', req.user?.id);

  try {
    // Log the export request
    logger.trackEvent('analytics_export_requested', {
      format,
      period,
      metrics,
      userId: req.user?.id,
    });

    // In a real implementation, this would generate and return actual data
    const exportData = {
      exportId: `export_${Date.now()}`,
      format,
      period,
      metrics,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/analytics/download/${Date.now()}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    trace.complete({ format, period, exportId: exportData.exportId });

    res.json({
      status: 'success',
      data: exportData
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

module.exports = { analyticsRouter: router };