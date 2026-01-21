const express = require('express');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const router = express.Router();

// Simple health check script that can be run standalone
const performHealthCheck = async () => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  let overallStatus = 'healthy';

  // Check database
  try {
    if (mongoose.connection.readyState === 1) {
      healthCheck.checks.database = {
        status: 'healthy',
        connection: 'connected',
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name
      };
    } else {
      healthCheck.checks.database = {
        status: 'unhealthy',
        connection: 'disconnected'
      };
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    healthCheck.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'unhealthy';
  }

  // Check memory usage
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const usagePercent = (usedMemory / totalMemory) * 100;

    let status = 'healthy';
    if (usagePercent > 90) {
      status = 'unhealthy';
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
    } else if (usagePercent > 80) {
      status = 'degraded';
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    healthCheck.checks.memory = {
      status,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      usagePercent: Math.round(usagePercent)
    };
  } catch (error) {
    healthCheck.checks.memory = {
      status: 'unhealthy',
      error: error.message
    };
    overallStatus = 'unhealthy';
  }

  healthCheck.status = overallStatus;
  return healthCheck;
};

// Standalone health check script
if (require.main === module) {
  performHealthCheck()
    .then(health => {
      console.log(JSON.stringify(health, null, 2));
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      process.exit(statusCode === 200 ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

module.exports = { performHealthCheck };