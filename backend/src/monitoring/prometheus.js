const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'monitored-backend',
  version: process.env.npm_package_version || '1.0.0',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const cacheHitRate = new client.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate as a ratio',
  labelNames: ['cache_type'],
});

const errorRate = new client.Gauge({
  name: 'error_rate',
  help: 'Current error rate',
  labelNames: ['service'],
});

const userActions = new client.Counter({
  name: 'user_actions_total',
  help: 'Total number of user actions',
  labelNames: ['action', 'user_type'],
});

const apiResponseSize = new client.Histogram({
  name: 'api_response_size_bytes',
  help: 'Size of API responses in bytes',
  labelNames: ['route', 'method'],
  buckets: [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
});

// Business metrics
const analyticsEvents = new client.Counter({
  name: 'analytics_events_total',
  help: 'Total number of analytics events',
  labelNames: ['event_name', 'source'],
});

const featureUsage = new client.Counter({
  name: 'feature_usage_total',
  help: 'Total number of feature usages',
  labelNames: ['feature', 'user_type'],
});

// Memory and CPU metrics
const memoryUsage = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

const cpuUsage = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
});

// Security metrics
const securityEvents = new client.Counter({
  name: 'security_events_total',
  help: 'Total number of security events',
  labelNames: ['event_type', 'severity', 'source'],
});

// Rate limiting metrics
const rateLimitHits = new client.Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['route', 'ip'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheHitRate);
register.registerMetric(errorRate);
register.registerMetric(userActions);
register.registerMetric(apiResponseSize);
register.registerMetric(analyticsEvents);
register.registerMetric(featureUsage);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);
register.registerMetric(securityEvents);
register.registerMetric(rateLimitHits);

// Middleware to collect HTTP request metrics
const prometheusMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    // Record metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
    
    apiResponseSize
      .labels(route, req.method)
      .observe(res.get('content-length') || 0);
    
    // Track error rate
    if (res.statusCode >= 400) {
      errorRate.labels('http').inc();
    }
    
    // Track security events
    if (res.statusCode === 429) {
      securityEvents.labels('rate_limit', 'medium', 'internal').inc();
    }
    
    if (res.statusCode >= 500) {
      securityEvents.labels('server_error', 'high', 'internal').inc();
    }
    
    // Decrement active connections
    activeConnections.dec();
    
    // Log performance metrics for slow requests
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}s`,
        statusCode: res.statusCode,
      });
    }
  });
  
  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating Prometheus metrics', { error: error.message });
    res.status(500).end('Error generating metrics');
  }
};

// Utility functions to update metrics
const trackDatabaseQuery = (operation, collection, duration) => {
  databaseQueryDuration.labels(operation, collection).observe(duration / 1000);
};

const trackCacheHit = (hit, cacheType = 'default') => {
  cacheHitRate.labels(cacheType).set(hit ? 1 : 0);
};

const trackUserAction = (action, userType = 'anonymous') => {
  userActions.labels(action, userType).inc();
};

const trackAnalyticsEvent = (eventName, source = 'backend') => {
  analyticsEvents.labels(eventName, source).inc();
};

const trackFeatureUsage = (feature, userType = 'anonymous') => {
  featureUsage.labels(feature, userType).inc();
};

const trackSecurityEvent = (eventType, severity, source = 'internal') => {
  securityEvents.labels(eventType, severity, source).inc();
};

const trackRateLimitHit = (route, ip) => {
  rateLimitHits.labels(route, ip).inc();
};

const updateSystemMetrics = () => {
  // Update memory usage
  const memUsage = process.memoryUsage();
  memoryUsage.labels('heap_used').set(memUsage.heapUsed);
  memoryUsage.labels('heap_total').set(memUsage.heapTotal);
  memoryUsage.labels('external').set(memUsage.external);
  memoryUsage.labels('rss').set(memUsage.rss);
  
  // Update CPU usage (this is a simple approximation)
  const cpuUsagePercent = process.cpuUsage();
  // This is a simplified CPU usage calculation
  // In production, you might want to use a more sophisticated approach
  cpuUsage.set(cpuUsagePercent.user / 1000000); // Convert to percentage
};

// Update system metrics every 30 seconds
setInterval(updateSystemMetrics, 30000);

module.exports = {
  register,
  prometheusMiddleware,
  metricsEndpoint,
  trackDatabaseQuery,
  trackCacheHit,
  trackUserAction,
  trackAnalyticsEvent,
  trackFeatureUsage,
  trackSecurityEvent,
  trackRateLimitHit,
  updateSystemMetrics,
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
  databaseQueryDuration,
  cacheHitRate,
  errorRate,
  userActions,
  apiResponseSize,
  analyticsEvents,
  featureUsage,
  memoryUsage,
  cpuUsage,
  securityEvents,
  rateLimitHits,
};