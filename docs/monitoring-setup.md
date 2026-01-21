# Comprehensive Monitoring Setup Guide

This guide provides step-by-step instructions for setting up the complete monitoring stack for both backend and mobile applications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Monitoring Setup](#backend-monitoring-setup)
3. [Mobile App Monitoring Setup](#mobile-app-monitoring-setup)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Configuration](#configuration)
6. [Testing the Setup](#testing-the-setup)
7. [Dashboard Configuration](#dashboard-configuration)
8. [Alerting Setup](#alerting-setup)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- Mobile development environment (Xcode for iOS, Android Studio for Android)

### Service Accounts

1. **Sentry Account**
   - Create account at [sentry.io](https://sentry.io)
   - Create new project for backend
   - Get DSN for configuration

2. **New Relic Account** (Optional)
   - Create account at [newrelic.com](https://newrelic.com)
   - Get license key for APM

3. **Firebase Project**
   - Create project at [console.firebase.google.com](https://console.firebase.google.com)
   - Add mobile apps (iOS and Android)
   - Enable Analytics and Crashlytics

4. **Grafana Account** (Optional)
   - Create account at [grafana.com](https://grafana.com)

## Backend Monitoring Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your actual configuration:

```bash
# Required: Database
MONGODB_URI=mongodb://localhost:27017/monitored-backend
REDIS_HOST=localhost
REDIS_PORT=6379

# Required: Authentication
JWT_SECRET=your-super-secret-jwt-key

# Required: Sentry (Error Tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=1.0

# Optional: New Relic (APM)
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key
NEW_RELIC_APP_NAME=Monitored Backend

# Optional: Other services
LOG_LEVEL=info
RATE_LIMIT_MAX=100
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

### 3. Start the Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Verify Backend Monitoring

Test the monitoring endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Metrics endpoint
curl http://localhost:3000/metrics

# Analytics endpoints
curl http://localhost:3000/api/analytics/summary
```

## Mobile App Monitoring Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Firebase Configuration

#### iOS Setup

1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to `mobile/ios/YourApp/GoogleService-Info.plist`
3. Update `mobile/ios/YourApp/Info.plist`:

```xml
<key>FIREBASE_ANALYTICS_COLLECTION_ENABLED</key>
<true/>
<key>FIREBASE_CRASHLYTICS_COLLECTION_ENABLED</key>
<true/>
```

#### Android Setup

1. Download `google-services.json` from Firebase Console
2. Add to `mobile/android/app/google-services.json`
3. Update `mobile/android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
apply plugin: 'com.google.firebase.crashlytics'
```

### 3. Environment Configuration

Create `mobile/.env`:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key

# Sentry Configuration (Optional)
SENTRY_DSN=your-sentry-dsn

# Analytics Configuration
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true
```

### 4. Run the Mobile App

#### iOS
```bash
cd mobile
npx react-native run-ios
```

#### Android
```bash
cd mobile
npx react-native run-android
```

### 5. Verify Mobile Monitoring

1. Open the app
2. Navigate to different screens
3. Check Firebase Console for analytics events
4. Test crash reporting using the built-in crash test screens

## Infrastructure Setup

### 1. Start Monitoring Stack

```bash
cd infrastructure
docker-compose up -d
```

This starts:
- Prometheus (metrics collection)
- Grafana (dashboards)
- AlertManager (alerting)
- Elasticsearch (log storage)
- Kibana (log visualization)
- Logstash (log processing)

### 2. Verify Services

Check that all services are running:

```bash
docker-compose ps
```

Access URLs:
- Grafana: http://localhost:3001 (admin/admin123)
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093
- Kibana: http://localhost:5601
- Jaeger: http://localhost:16686

## Configuration

### Sentry Configuration

1. Create Sentry projects for backend and mobile
2. Update DSNs in environment files
3. Configure release tracking in Sentry
4. Set up custom tags and context

### New Relic Configuration

1. Install New Relic agent:
```bash
npm install newrelic
```

2. Update environment with license key
3. Configure custom attributes and metrics

### Firebase Configuration

1. **Analytics Setup**:
   - Enable Google Analytics in Firebase Console
   - Configure custom events
   - Set up conversion tracking

2. **Crashlytics Setup**:
   - Enable Crashlytics in Firebase Console
   - Configure NDK crash reporting for Android
   - Set up crashlytics breakpoints for debugging

## Testing the Setup

### Backend Tests

1. **Health Check**:
```bash
curl http://localhost:3000/health
```

2. **Error Tracking**:
```bash
curl -X POST http://localhost:3000/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"eventName":"test_error","properties":{"test":true}}'
```

3. **Metrics**:
```bash
curl http://localhost:3000/metrics
```

### Mobile Tests

1. **Analytics Events**: Use the analytics test button in the app
2. **Error Handling**: Use the error test screens
3. **Crash Reporting**: Use the crash test screens

### Infrastructure Tests

1. **Prometheus Targets**: http://localhost:9090/targets
2. **Grafana Dashboards**: http://localhost:3001
3. **Alert Firing**: Trigger alerts using the test buttons

## Dashboard Configuration

### Grafana Dashboards

1. Import pre-built dashboards:
   - Backend API Monitoring
   - Mobile App Analytics
   - Infrastructure Metrics
   - Error Tracking

2. Create custom dashboards:
   - Real-time metrics
   - Business KPIs
   - User journey analytics

### Kibana Dashboards

1. Create log analysis dashboards
2. Set up log alerts
3. Build error tracking visualizations

## Alerting Setup

### AlertManager Configuration

1. Update email and Slack webhook configurations
2. Test alert routing
3. Configure escalation policies

### Notification Channels

1. **Email**: Configure SMTP settings
2. **Slack**: Set up webhook integrations
3. **PagerDuty**: Configure for critical alerts

## Troubleshooting

### Common Issues

1. **Backend not exposing metrics**:
   - Check Prometheus configuration
   - Verify `/metrics` endpoint is accessible
   - Check network connectivity

2. **Mobile app crashes not reported**:
   - Verify Firebase configuration
   - Check network connectivity
   - Ensure app is in release mode for Crashlytics

3. **Alerts not firing**:
   - Check AlertManager configuration
   - Verify Prometheus rules
   - Check notification channel setup

4. **Logs not appearing in Kibana**:
   - Check Logstash configuration
   - Verify Elasticsearch is running
   - Check Logstash pipeline logs

### Debug Commands

```bash
# Check backend logs
docker-compose logs backend

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Test alert rules
curl http://localhost:9090/api/v1/rules

# Check Grafana datasources
curl http://admin:admin123@localhost:3001/api/datasources
```

### Getting Help

- Check service-specific documentation
- Review application logs
- Use the built-in debugging screens in the mobile app
- Monitor system resources and network connectivity