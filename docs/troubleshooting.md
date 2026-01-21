# Troubleshooting Guide

This guide helps you diagnose and resolve common issues in the monitoring and analytics system.

## Quick Diagnosis

### Health Check Commands

```bash
# Backend health check
curl http://localhost:3000/health

# Backend detailed health
curl http://localhost:3000/health/detailed

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check AlertManager status
curl http://localhost:9093/api/v1/status

# Check service logs
docker-compose logs -f backend
```

## Common Issues and Solutions

### Backend Issues

#### 1. Metrics Not Available

**Symptoms**:
- `/metrics` endpoint returns 404 or empty response
- Prometheus shows targets as down
- No metrics visible in Grafana

**Diagnosis**:
```bash
# Check if metrics endpoint is accessible
curl http://localhost:3000/metrics

# Check backend logs for errors
docker-compose logs backend | grep -i error

# Verify Prometheus configuration
curl http://localhost:9090/api/v1/targets
```

**Solutions**:
1. Verify Prometheus is scraping the correct endpoint:
   ```yaml
   # Check prometheus.yml
   scrape_configs:
     - job_name: 'backend-api'
       static_configs:
         - targets: ['backend:3000']
       metrics_path: '/metrics'
   ```

2. Ensure backend is exposing metrics:
   ```javascript
   // Verify prometheusMiddleware is loaded in server.js
   const { prometheusMiddleware } = require('./monitoring/prometheus');
   app.use(prometheusMiddleware);
   ```

3. Check environment variables:
   ```bash
   # Verify Prometheus is enabled
   echo $PROMETHEUS_ENABLED
   # Should output: true
   ```

#### 2. High Memory Usage

**Symptoms**:
- Backend crashes due to memory issues
- Slow response times
- High memory alerts

**Diagnosis**:
```bash
# Check memory usage
curl http://localhost:3000/health | grep memory

# Monitor memory in real-time
docker stats backend

# Check for memory leaks in logs
docker-compose logs backend | grep -i memory
```

**Solutions**:
1. Optimize database queries:
   ```javascript
   // Add indexes to database queries
   db.users.find({}).explain("executionStats")
   
   // Use pagination for large datasets
   const users = await User.find().limit(100).skip(offset);
   ```

2. Implement caching:
   ```javascript
   // Add Redis caching for frequently accessed data
   const cache = require('./utils/cache');
   const user = await cache.get(`user:${userId}`) || 
                await User.findById(userId);
   ```

3. Monitor memory usage:
   ```javascript
   // Add memory monitoring
   setInterval(() => {
     const memUsage = process.memoryUsage();
     if (memUsage.heapUsed / 1024 / 1024 > 500) { // 500MB threshold
       logger.warn('High memory usage detected', memUsage);
     }
   }, 30000);
   ```

#### 3. Database Connection Issues

**Symptoms**:
- "MongoNetworkError" in logs
- Slow database queries
- Connection pool exhausted

**Diagnosis**:
```bash
# Test database connectivity
docker-compose exec mongo mongo --eval "db.adminCommand('ismaster')"

# Check connection pool status
curl http://localhost:3000/health | grep database

# Monitor database performance
docker-compose exec mongo mongostat
```

**Solutions**:
1. Optimize connection settings:
   ```javascript
   // MongoDB connection options
   mongoose.connect(uri, {
     maxPoolSize: 10, // Maximum connections in pool
     serverSelectionTimeoutMS: 5000, // How long to try selecting a server
     socketTimeoutMS: 45000, // How long to wait for a socket
     bufferMaxEntries: 0, // Disable mongoose buffering
   });
   ```

2. Add connection monitoring:
   ```javascript
   mongoose.connection.on('connected', () => {
     logger.info('MongoDB connected');
   });
   
   mongoose.connection.on('error', (err) => {
     logger.error('MongoDB error', err);
   });
   ```

3. Implement retry logic:
   ```javascript
   const connectWithRetry = async (retries = 5) => {
     try {
       await mongoose.connect(uri, options);
       logger.info('Database connected');
     } catch (error) {
       if (retries > 0) {
         logger.warn(`Database connection failed, retrying... (${retries} retries left)`);
         setTimeout(() => connectWithRetry(retries - 1), 5000);
       } else {
         throw error;
       }
     }
   };
   ```

### Mobile App Issues

#### 1. Crash Reporting Not Working

**Symptoms**:
- No crashes visible in Firebase Console
- Test crashes don't appear in dashboard
- App crashes without notification

**Diagnosis**:
```bash
# Check Firebase configuration
# In iOS: Verify GoogleService-Info.plist is included
# In Android: Verify google-services.json is included

# Check Firebase initialization
# Add to app startup:
firebase.app(); // Should not throw error
```

**Solutions**:
1. Verify Firebase configuration:
   ```javascript
   // Check Firebase app initialization
   import { initializeApp } from '@react-native-firebase/app';
   import crashlytics from '@react-native-firebase/crashlytics';
   
   const app = initializeApp(firebaseConfig);
   console.log('Firebase initialized:', app.name);
   
   // Test crashlytics
   crashlytics().log('Test log message');
   console.log('Crashlytics initialized');
   ```

2. Check platform-specific setup:

   **iOS**:
   ```xml
   <!-- In ios/YourApp/Info.plist -->
   <key>FIREBASE_ANALYTICS_COLLECTION_ENABLED</key>
   <true/>
   <key>FIREBASE_CRASHLYTICS_COLLECTION_ENABLED</key>
   <true/>
   ```

   **Android**:
   ```gradle
   // In android/app/build.gradle
   apply plugin: 'com.google.gms.google-services'
   apply plugin: 'com.google.firebase.crashlytics'
   ```

3. Verify build configuration:
   ```bash
   # iOS - ensure Crashlytics is linked
   react-native link @react-native-firebase/crashlytics
   
   # Android - enable Crashlytics NDK
   android {
     defaultConfig {
       // Enable Crashlytics NDK
       manifestPlaceholders = [crashlyticsCollectionEnabled: "true"]
     }
   }
   ```

#### 2. Analytics Events Not Tracking

**Symptoms**:
- Analytics dashboard shows no events
- Custom events not appearing
- User actions not tracked

**Diagnosis**:
```javascript
// Add debugging to check analytics
import analytics from '@react-native-firebase/analytics';

const debugAnalytics = async () => {
  console.log('Analytics enabled:', await analytics().isSupported());
  console.log('Analytics collection enabled:', await analytics().isDataCollectionEnabled());
};

// Call in app startup
debugAnalytics();
```

**Solutions**:
1. Verify analytics permissions:
   ```javascript
   // Check if analytics is supported
   const isSupported = await analytics().isSupported();
   if (!isSupported) {
     console.warn('Analytics not supported on this platform');
   }
   ```

2. Check event tracking implementation:
   ```javascript
   // Correct event tracking
   await analytics().logEvent('button_press', {
     button_name: 'login_button',
     screen_name: 'LoginScreen',
   });
   
   // Add error handling
   try {
     await analytics().logEvent('custom_event', parameters);
   } catch (error) {
     console.error('Analytics tracking failed:', error);
   }
   ```

3. Verify network connectivity:
   ```javascript
   // Check network status
   import NetInfo from '@react-native-community/netinfo';
   
   NetInfo.addEventListener(state => {
     console.log('Network status:', state.isConnected);
     if (state.isConnected) {
       // Analytics can send data
     }
   });
   ```

### Infrastructure Issues

#### 1. Prometheus Target Down

**Symptoms**:
- Targets showing as down in Prometheus
- No metrics being scraped
- AlertManager firing ServiceDown alerts

**Diagnosis**:
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets'

# Test connectivity to backend
curl -v http://backend:3000/metrics

# Check Docker networking
docker network ls
docker network inspect monitoring-network
```

**Solutions**:
1. Verify network connectivity:
   ```bash
   # Test from Prometheus container
   docker-compose exec prometheus wget -qO- http://backend:3000/metrics
   
   # Check Docker network
   docker network inspect monitoring-network
   ```

2. Fix Docker network issues:
   ```yaml
   # Ensure services are on same network
   services:
     backend:
       networks:
         - monitoring-network
     prometheus:
       networks:
         - monitoring-network
   ```

3. Update Prometheus configuration:
   ```yaml
   # Use service names, not localhost
   scrape_configs:
     - job_name: 'backend-api'
       static_configs:
         - targets: ['backend:3000']  # Use service name
   ```

#### 2. AlertManager Not Sending Notifications

**Symptoms**:
- Alerts fire but no notifications received
- Email/Slack notifications not working
- AlertManager shows alerts but no emails

**Diagnosis**:
```bash
# Check AlertManager status
curl http://localhost:9093/api/v1/status

# Test alert routing
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{"labels":{"alertname":"TestAlert","severity":"warning"}}]'

# Check AlertManager logs
docker-compose logs alertmanager | grep -i error
```

**Solutions**:
1. Verify email configuration:
   ```yaml
   # Check alertmanager.yml
   global:
     smtp_smarthost: 'smtp.gmail.com:587'
     smtp_from: 'alerts@yourcompany.com'
     smtp_auth_username: 'your-email@gmail.com'
     smtp_auth_password: 'your-app-password'
   ```

2. Test SMTP connectivity:
   ```bash
   # Test from AlertManager container
   docker-compose exec alertmanager nc -zv smtp.gmail.com 587
   ```

3. Verify Slack webhook:
   ```yaml
   # Check Slack configuration
   slack_configs:
     - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
       channel: '#alerts'
   ```

#### 3. Kibana No Logs Display

**Symptoms**:
- Kibana shows no data
- Log search returns no results
- Logstash not processing logs

**Diagnosis**:
```bash
# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# Check Logstash pipeline
curl http://localhost:9600/_node/stats/pipelines

# Verify log files exist
docker-compose exec backend ls -la logs/

# Check Logstash processing
docker-compose logs logstash | grep -i error
```

**Solutions**:
1. Fix Elasticsearch issues:
   ```bash
   # Check Elasticsearch cluster health
   curl -X GET "localhost:9200/_cluster/health?pretty"
   
   # If red status, restart Elasticsearch
   docker-compose restart elasticsearch
   ```

2. Fix Logstash configuration:
   ```yaml
   # Verify input configuration in logstash.conf
   input {
     tcp {
       port => 5000
       codec => json
     }
   }
   
   # Test with simple configuration
   input { stdin { } }
   output { elasticsearch { hosts => ["elasticsearch:9200"] } }
   ```

3. Ensure logs are being generated:
   ```javascript
   // Verify Winston is writing logs
   const logger = require('./utils/logger');
   logger.info('Test log message');
   
   // Check log file creation
   docker-compose exec backend ls -la logs/
   ```

### Performance Issues

#### 1. Slow Grafana Dashboards

**Symptoms**:
- Dashboards take long time to load
- Queries timeout
- High resource usage

**Diagnosis**:
```bash
# Check Grafana performance
curl http://admin:admin123@localhost:3001/api/health

# Monitor database queries
docker-compose exec grafana ps aux | grep postgres

# Check Prometheus query performance
curl "http://localhost:9090/api/v1/query?query=rate(http_requests_total[5m])"
```

**Solutions**:
1. Optimize Prometheus queries:
   ```promql
   # Use recording rules for complex queries
   groups:
     - name: recording.rules
       interval: 30s
       rules:
         - record: job:http_requests:rate5m
           expr: rate(http_requests_total[5m])
   ```

2. Reduce dashboard query complexity:
   - Use shorter time ranges
   - Limit number of panels
   - Use more efficient aggregations

3. Increase resource allocation:
   ```yaml
   # In docker-compose.yml
   grafana:
     image: grafana/grafana:10.0.0
     environment:
       - GF_DATABASE_MAX_OPEN_CONN=100
       - GF_DATABASE_MAX_IDLE_CONN=100
     volumes:
       - grafana_data:/var/lib/grafana
   ```

#### 2. High Log Volume

**Symptoms**:
- Elasticsearch disk space running low
- Kibana queries slow
- High resource usage

**Diagnosis**:
```bash
# Check Elasticsearch disk usage
curl http://localhost:9200/_cat/allocation?v

# Check log volume
docker system df
docker volume ls

# Monitor log ingestion rate
curl http://localhost:9600/_node/stats | jq '.process.open_file_descriptors'
```

**Solutions**:
1. Implement log retention:
   ```json
   # In Elasticsearch ILM policy
   {
     "policy": {
       "phases": {
         "hot": { "min_age": "0ms" },
         "warm": { "min_age": "7d" },
         "delete": { "min_age": "30d" }
       }
     }
   }
   ```

2. Reduce log verbosity:
   ```javascript
   // Use appropriate log levels
   logger.debug('Detailed debug info'); // Only in development
   logger.info('User action'); // Important actions
   logger.warn('Potential issue'); // Warnings
   logger.error('Error occurred'); // Errors only
   ```

3. Implement log sampling:
   ```yaml
   # In Logstash configuration
   filter {
     if [level] == "debug" {
       throttle {
         before_count => 100
         period => 60
         key => "%{service}"
       }
     }
   }
   ```

## Emergency Procedures

### Service Recovery

#### 1. Complete Stack Restart

```bash
# Stop all services
docker-compose down

# Clean up volumes (WARNING: This deletes all data)
docker-compose down -v

# Restart with fresh state
docker-compose up -d

# Check health
curl http://localhost:3000/health
curl http://localhost:9090/api/v1/targets
```

#### 2. Emergency Metrics Collection

```bash
# If Prometheus is down, collect metrics manually
for metric in $(curl -s http://localhost:3000/metrics | grep '^# TYPE' | awk '{print $2}' | cut -d'_' -f1 | sort -u); do
  echo "=== $metric ==="
  curl -s http://localhost:3000/metrics | grep "^$metric"
done
```

#### 3. Emergency Alerting

```bash
# Disable all alerts temporarily
curl -X POST http://localhost:9093/api/v1/silences \
  -H 'Content-Type: application/json' \
  -d '{
    "matchers": [
      {"name": "alertname", "value": ".*"}
    ],
    "startsAt": "'$(date -Iseconds)'",
    "endsAt": "'$(date -d '+1 hour' -Iseconds)'",
    "createdBy": "emergency-procedure",
    "comment": "Emergency maintenance - all alerts silenced"
  }'
```

### Data Recovery

#### 1. Backup Critical Data

```bash
# Backup Prometheus data
docker-compose exec prometheus tar czf /tmp/prometheus-backup.tar.gz /prometheus
docker cp prometheus_container:/tmp/prometheus-backup.tar.gz ./backup-prometheus-$(date +%Y%m%d).tar.gz

# Backup Grafana dashboards
curl -u admin:admin123 http://localhost:3001/api/search > grafana-dashboards-$(date +%Y%m%d).json

# Backup Elasticsearch indices
curl -X POST http://localhost:9200/_snapshot/backup/snapshot_$(date +%Y%m%d)
```

#### 2. Restore from Backup

```bash
# Restore Prometheus data
docker-compose exec prometheus rm -rf /prometheus/*
docker cp ./backup-prometheus-20240115.tar.gz prometheus_container:/tmp/
docker-compose exec prometheus tar xzf /tmp/backup-prometheus-20240115.tar.gz -C /
docker-compose restart prometheus

# Restore Grafana dashboards
# Import via Grafana API or UI
```

## Monitoring Health Checks

### Automated Health Checks

Create a monitoring script:

```bash
#!/bin/bash
# health-check.sh

echo "=== System Health Check ==="

# Check backend
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
  echo "✅ Backend: Healthy"
else
  echo "❌ Backend: Unhealthy"
fi

# Check Prometheus
if curl -f http://localhost:9090/-/healthy >/dev/null 2>&1; then
  echo "✅ Prometheus: Healthy"
else
  echo "❌ Prometheus: Unhealthy"
fi

# Check AlertManager
if curl -f http://localhost:9093/-/healthy >/dev/null 2>&1; then
  echo "✅ AlertManager: Healthy"
else
  echo "❌ AlertManager: Unhealthy"
fi

# Check Grafana
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
  echo "✅ Grafana: Healthy"
else
  echo "❌ Grafana: Unhealthy"
fi

# Check Elasticsearch
if curl -f http://localhost:9200/_cluster/health >/dev/null 2>&1; then
  echo "✅ Elasticsearch: Healthy"
else
  echo "❌ Elasticsearch: Unhealthy"
fi

# Check Docker containers
echo "=== Container Status ==="
docker-compose ps

echo "=== Disk Usage ==="
df -h

echo "=== Memory Usage ==="
free -h

echo "=== Health Check Complete ==="
```

Run health checks:
```bash
chmod +x health-check.sh
./health-check.sh
```

### Continuous Monitoring

Set up automated health monitoring:

```bash
# Add to crontab for regular checks
*/5 * * * * /path/to/health-check.sh >> /var/log/monitoring-health.log 2>&1

# Monitor specific metrics
*/1 * * * * curl -s http://localhost:3000/metrics | grep http_requests_total | tail -1
```

## Getting Help

### Documentation Resources

1. **Official Documentation**:
   - [Prometheus Documentation](https://prometheus.io/docs/)
   - [Grafana Documentation](https://grafana.com/docs/)
   - [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
   - [Elasticsearch Documentation](https://www.elastic.co/guide/)

2. **Firebase Documentation**:
   - [Firebase Analytics](https://firebase.google.com/docs/analytics)
   - [Firebase Crashlytics](https://firebase.google.com/docs/crashlytics)

### Support Channels

1. **Internal Support**:
   - Check team Slack channels
   - Review incident postmortems
   - Contact on-call engineers

2. **External Support**:
   - GitHub issues for open source tools
   - Community forums for specific technologies
   - Vendor support for commercial services

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Backend debug mode
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Prometheus debug
docker-compose exec prometheus ./prometheus --log.level=debug

# Elasticsearch debug
docker-compose exec elasticsearch elasticsearch --debug
```