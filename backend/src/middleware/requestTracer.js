const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Request ID generator
const generateRequestId = () => {
  return uuidv4();
};

// Request tracing middleware
const requestTracer = (req, res, next) => {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Add request ID to request and response objects
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Generate correlation ID for distributed tracing
  const correlationId = req.headers['x-correlation-id'] || generateRequestId();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Add tracing headers for upstream services
  res.setHeader('X-Trace-ID', requestId);
  res.setHeader('X-Span-ID', generateRequestId());
  
  // Start timing
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId,
    correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
  
  // Override res.end to capture response time and log completion
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log request completion
    logger.info('Request completed', {
      requestId,
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      userId: req.user?.id,
    });
    
    // Track API performance
    logger.trackAPICall(req.method, req.url, res.statusCode, duration, req.user?.id);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  // Add request context for downstream middleware/routes
  req.tracing = {
    requestId,
    correlationId,
    startTime,
    parentSpanId: req.headers['x-span-id'],
  };
  
  next();
};

// Database query tracing
const traceDatabaseQuery = (operation, collection) => {
  const queryId = uuidv4();
  const startTime = Date.now();
  
  return {
    queryId,
    operation,
    collection,
    startTime,
    end: () => {
      const duration = Date.now() - startTime;
      logger.info('Database query completed', {
        queryId,
        operation,
        collection,
        duration: `${duration}ms`,
      });
      
      // Track database performance
      const { trackDatabaseQuery } = require('../monitoring/prometheus');
      trackDatabaseQuery(operation, collection, duration);
      
      return duration;
    },
  };
};

// External API call tracing
const traceAPICall = (service, endpoint, method = 'GET') => {
  const callId = uuidv4();
  const startTime = Date.now();
  
  logger.info('External API call started', {
    callId,
    service,
    endpoint,
    method,
  });
  
  return {
    callId,
    service,
    endpoint,
    method,
    startTime,
    success: (responseTime, statusCode = 200) => {
      const duration = Date.now() - startTime;
      logger.info('External API call succeeded', {
        callId,
        service,
        endpoint,
        method,
        statusCode,
        duration: `${duration}ms`,
      });
      
      return duration;
    },
    error: (error) => {
      const duration = Date.now() - startTime;
      logger.error('External API call failed', {
        callId,
        service,
        endpoint,
        method,
        duration: `${duration}ms`,
        error: error.message,
      });
      
      return duration;
    },
  };
};

// Business logic tracing
const traceBusinessOperation = (operation, userId = null) => {
  const operationId = uuidv4();
  const startTime = Date.now();
  
  logger.info('Business operation started', {
    operationId,
    operation,
    userId,
  });
  
  return {
    operationId,
    operation,
    userId,
    startTime,
    complete: (result = null) => {
      const duration = Date.now() - startTime;
      logger.info('Business operation completed', {
        operationId,
        operation,
        userId,
        duration: `${duration}ms`,
        result,
      });
      
      // Track user actions
      const { trackUserAction } = require('../monitoring/prometheus');
      trackUserAction(operation, userId ? 'authenticated' : 'anonymous');
      
      return duration;
    },
    error: (error) => {
      const duration = Date.now() - startTime;
      logger.error('Business operation failed', {
        operationId,
        operation,
        userId,
        duration: `${duration}ms`,
        error: error.message,
      });
      
      return duration;
    },
  };
};

// Cache operation tracing
const traceCacheOperation = (operation, key) => {
  const cacheId = uuidv4();
  const startTime = Date.now();
  
  return {
    cacheId,
    operation,
    key,
    startTime,
    hit: () => {
      const duration = Date.now() - startTime;
      logger.debug('Cache hit', {
        cacheId,
        operation,
        key,
        duration: `${duration}ms`,
      });
      
      const { trackCacheHit } = require('../monitoring/prometheus');
      trackCacheHit(true);
      
      return duration;
    },
    miss: () => {
      const duration = Date.now() - startTime;
      logger.debug('Cache miss', {
        cacheId,
        operation,
        key,
        duration: `${duration}ms`,
      });
      
      const { trackCacheHit } = require('../monitoring/prometheus');
      trackCacheHit(false);
      
      return duration;
    },
  };
};

module.exports = {
  requestTracer,
  traceDatabaseQuery,
  traceAPICall,
  traceBusinessOperation,
  traceCacheOperation,
  generateRequestId,
};