const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  let overallStatus = 'healthy';

  try {
    // Check database connection
    const dbStatus = await checkDatabase();
    healthCheck.checks.database = dbStatus;
    if (dbStatus.status !== 'healthy') {
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    healthCheck.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'unhealthy';
  }

  try {
    // Check Redis connection
    const redisStatus = await checkRedis();
    healthCheck.checks.redis = redisStatus;
    if (redisStatus.status !== 'healthy') {
      overallStatus = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.redis = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'degraded';
  }

  try {
    // Check memory usage
    const memoryStatus = checkMemory();
    healthCheck.checks.memory = memoryStatus;
    if (memoryStatus.status === 'unhealthy') {
      overallStatus = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.memory = {
      status: 'unhealthy',
      error: error.message
    };
  }

  try {
    // Check external services
    const servicesStatus = await checkExternalServices();
    healthCheck.checks.externalServices = servicesStatus;
  } catch (error) {
    healthCheck.checks.externalServices = {
      status: 'unhealthy',
      error: error.message
    };
  }

  healthCheck.status = overallStatus;

  // Log health check
  logger.info('Health check performed', {
    status: overallStatus,
    checks: healthCheck.checks,
    uptime: healthCheck.uptime,
  });

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthCheck);
});

// Detailed health check for monitoring systems
router.get('/detailed', async (req, res) => {
  const detailedHealth = {
    ...await getDetailedHealth(),
    recommendations: []
  };

  // Add recommendations based on health status
  if (detailedHealth.checks.memory.usagePercent > 80) {
    detailedHealth.recommendations.push('Consider increasing memory allocation');
  }

  if (detailedHealth.checks.database.avgResponseTime > 1000) {
    detailedHealth.recommendations.push('Database response time is slow, check query performance');
  }

  res.json(detailedHealth);
});

// Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness probe for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    await checkDatabase();
    await checkRedis();
    res.status(200).json({ 
      status: 'ready', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check functions
async function checkDatabase() {
  const start = Date.now();
  
  try {
    // Check if mongoose connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Perform a simple query to test database responsiveness
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - start;

    return {
      status: 'healthy',
      connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: `${Date.now() - start}ms`
    };
  }
}

async function checkRedis() {
  const start = Date.now();
  let client;

  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
    });

    await client.connect();
    await client.ping();
    const responseTime = Date.now() - start;
    
    await client.quit();

    return {
      status: 'healthy',
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    if (client) {
      await client.quit().catch(() => {});
    }
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: `${Date.now() - start}ms`
    };
  }
}

function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const usagePercent = (usedMemory / totalMemory) * 100;

  let status = 'healthy';
  if (usagePercent > 90) {
    status = 'unhealthy';
  } else if (usagePercent > 80) {
    status = 'degraded';
  }

  return {
    status,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    usagePercent: Math.round(usagePercent)
  };
}

async function checkExternalServices() {
  const services = {
    sentry: process.env.SENTRY_DSN ? 'configured' : 'not configured',
    newrelic: process.env.NEW_RELIC_LICENSE_KEY ? 'configured' : 'not configured',
  };

  const status = Object.values(services).every(service => service === 'configured') 
    ? 'healthy' : 'partial';

  return {
    status,
    services
  };
}

async function getDetailedHealth() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemory(),
      externalServices: await checkExternalServices(),
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null
      }
    }
  };
}

module.exports = { healthCheck: router };