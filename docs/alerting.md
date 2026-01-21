# Alerting Configuration Guide

This guide explains how to configure and manage the alerting system for the comprehensive monitoring setup.

## Overview

The alerting system uses multiple components:
- **Prometheus**: Metrics collection and alert rule evaluation
- **AlertManager**: Alert routing, notification, and escalation
- **Grafana**: Alert visualization and dashboard integration
- **Multiple Channels**: Email, Slack, PagerDuty, webhooks

## Alert Types and Categories

### 1. Critical Alerts (Immediate Response Required)

#### Service Down
- **Trigger**: Service becomes unavailable
- **Response Time**: < 1 minute
- **Channels**: PagerDuty, Slack, Email
- **Escalation**: Immediate to on-call engineer

#### Database Connection Lost
- **Trigger**: Database connectivity issues
- **Response Time**: < 2 minutes
- **Channels**: Slack, Email
- **Escalation**: Database team notification

#### High Error Rate
- **Trigger**: Error rate > 10% for 5 minutes
- **Response Time**: < 5 minutes
- **Channels**: Slack, Email
- **Escalation**: Backend team notification

### 2. Warning Alerts (Response Within 30 Minutes)

#### High Response Time
- **Trigger**: 95th percentile > 1 second for 10 minutes
- **Response Time**: < 30 minutes
- **Channels**: Slack notifications
- **Escalation**: Backend team during business hours

#### Memory Usage High
- **Trigger**: Memory usage > 80% for 5 minutes
- **Response Time**: < 30 minutes
- **Channels**: Email to infrastructure team
- **Escalation**: Infrastructure team notification

#### Disk Space Low
- **Trigger**: Disk space < 10% available
- **Response Time**: < 1 hour
- **Channels**: Email to infrastructure team
- **Escalation**: System administrator notification

### 3. Mobile App Alerts

#### High Crash Rate
- **Trigger**: Crash rate > 1% for 5 minutes
- **Response Time**: < 15 minutes
- **Channels**: Slack, Email to mobile team
- **Escalation**: Mobile team notification

#### Analytics Events Drop
- **Trigger**: Significant drop in analytics events
- **Response Time**: < 1 hour
- **Channels**: Email to product team
- **Escalation**: Analytics team notification

## Alert Manager Configuration

### 1. Notification Routing

```yaml
# Basic routing structure
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  
  routes:
    # Critical alerts route
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 0s
      repeat_interval: 5m
      
    # Team-specific routes
    - match:
        team: backend
      receiver: 'backend-team'
```

### 2. Team-Based Routing

```yaml
# Backend team alerts
- match:
    team: backend
  receiver: 'backend-team'
  routes:
    - match:
        alertname: HighErrorRate
      receiver: 'backend-critical'
    - match:
        alertname: HighResponseTime
      receiver: 'backend-warning'

# Mobile team alerts  
- match:
    team: mobile
  receiver: 'mobile-team'
  
# Infrastructure team alerts
- match:
    team: infrastructure
  receiver: 'infrastructure-team'
```

### 3. Severity-Based Escalation

```yaml
# Critical alerts - immediate escalation
- match:
    severity: critical
  receiver: 'oncall-engineer'
  group_wait: 0s
  repeat_interval: 5m
  
# Warning alerts - business hours escalation
- match:
    severity: warning
  receiver: 'team-notification'
  group_interval: 30s
  repeat_interval: 2h
```

## Notification Channels

### 1. Email Configuration

```yaml
email_configs:
  - to: 'oncall@company.com'
    subject: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      🚨 CRITICAL ALERT
      
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Severity: {{ .Labels.severity }}
      Service: {{ .Labels.service }}
      Time: {{ .StartsAt.Format "2006-01-02 15:04:05 MST" }}
      
      Immediate action required!
      {{ end }}
```

### 2. Slack Integration

```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts-critical'
    title: '🚨 Critical Alert: {{ .GroupLabels.alertname }}'
    text: |
      {{ range .Alerts }}
      *Alert:* {{ .Annotations.summary }}
      *Description:* {{ .Annotations.description }}
      *Severity:* {{ .Labels.severity }}
      *Time:* {{ .StartsAt.Format "2006-01-02 15:04:05 MST" }}
      
      *Runbook:* {{ .Annotations.runbook_url }}
      {{ end }}
    send_resolved: true
```

### 3. PagerDuty Integration

```yaml
pagerduty_configs:
  - routing_key: 'your-pagerduty-integration-key'
    description: '{{ .GroupLabels.alertname }}'
    severity: '{{ .CommonLabels.severity }}'
    source: '{{ .CommonLabels.instance }}'
    component: '{{ .CommonLabels.service }}'
    group: '{{ .CommonLabels.cluster }}'
    class: 'monitoring_alert'
    custom_details:
      alertmanager: '{{ .ExternalURL }}'
      dashboard: '{{ .CommonLabels.dashboard_url }}'
```

### 4. Webhook Configuration

```yaml
webhook_configs:
  - url: 'http://your-service/alerts'
    send_resolved: true
    http_config:
      basic_auth:
        username: 'alerts'
        password: 'webhook-password'
    title: 'Alert: {{ .GroupLabels.alertname }}'
    text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

## Alert Rules Configuration

### 1. Backend API Alerts

```yaml
groups:
  - name: backend-api.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
          team: backend
          service: backend-api
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
          runbook_url: "https://docs.company.com/runbooks/high-error-rate"
          dashboard_url: "http://grafana:3001/d/backend-api"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
          team: backend
          service: backend-api
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      # Database connection issues
      - alert: DatabaseConnectionDown
        expr: up{job="mongodb"} == 0
        for: 2m
        labels:
          severity: critical
          team: backend
          service: database
        annotations:
          summary: "Database connection is down"
          description: "MongoDB has been down for more than 2 minutes"
```

### 2. Mobile App Alerts

```yaml
groups:
  - name: mobile-app.rules
    rules:
      # High crash rate
      - alert: HighMobileCrashRate
        expr: rate(mobile_crashes_total[10m]) > 0.01
        for: 5m
        labels:
          severity: critical
          team: mobile
          service: mobile-app
        annotations:
          summary: "High mobile app crash rate"
          description: "Mobile app crash rate is {{ $value }} per second"
          
      # Analytics events drop
      - alert: MobileAnalyticsEventsDrop
        expr: rate(analytics_events_total{source="mobile"}[5m]) < 0.1
        for: 10m
        labels:
          severity: warning
          team: mobile
          service: mobile-app
        annotations:
          summary: "Mobile analytics events dropped"
          description: "Mobile analytics events are below normal rate"
```

### 3. Infrastructure Alerts

```yaml
groups:
  - name: infrastructure.rules
    rules:
      # High memory usage
      - alert: HighMemoryUsage
        expr: (process_resident_memory_bytes / 1024 / 1024) / (node_memory_MemTotal_bytes / 1024 / 1024) * 100 > 80
        for: 5m
        labels:
          severity: warning
          team: infrastructure
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80%"
          
      # Disk space low
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
          team: infrastructure
        annotations:
          summary: "Low disk space"
          description: "Disk space is below 10% on {{ $labels.mountpoint }}"
```

## Alert Testing and Validation

### 1. Testing Alert Rules

```bash
# Test Prometheus alert rules
curl -H "Content-Type: application/yaml" \
  --data-binary @prometheus/rules/monitoring.yml \
  http://localhost:9090/api/v1/rules

# Check alert rule evaluation
curl "http://localhost:9090/api/v1/rules?type=alert"

# Test specific alert condition
curl "http://localhost:9090/api/v1/query?query=rate(http_requests_total[5m])"
```

### 2. Testing Alert Notifications

```bash
# Test AlertManager configuration
curl -X POST \
  http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "critical",
      "service": "backend-api",
      "team": "backend"
    },
    "annotations": {
      "summary": "Test alert",
      "description": "This is a test alert"
    }
  }]'
```

### 3. Notification Testing

```bash
# Test email notifications
curl -X POST \
  http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestEmail",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test email notification"
    }
  }]'
```

## Escalation Policies

### 1. Critical Alert Escalation

```
Level 1 (0-5 minutes):
- On-call engineer notification
- Slack #critical-alerts channel
- PagerDuty alert

Level 2 (5-15 minutes):
- Engineering manager notification
- Team lead notification

Level 3 (15-30 minutes):
- CTO notification
- Emergency response team activation

Level 4 (>30 minutes):
- Executive notification
- Incident commander assignment
```

### 2. Warning Alert Escalation

```
Level 1 (0-30 minutes):
- Team Slack channel notification
- Email to team distribution list

Level 2 (>30 minutes):
- Team lead notification
- Daily standup discussion
```

## Alert Suppression and Maintenance

### 1. Maintenance Windows

```yaml
# Suppress alerts during maintenance
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service is down"
  # Suppress during maintenance windows
  expiring:
    start: "2024-01-15T02:00:00Z"
    end: "2024-01-15T04:00:00Z"
    comment: "Planned maintenance window"
```

### 2. Alert Correlation

```yaml
# Inhibit lower priority alerts when higher priority ones are firing
inhibit_rules:
  # If service is down, suppress all other alerts for that service
  - source_match:
      alertname: ServiceDown
    target_match:
      service: 'backend-api'
    equal: ['service']
    
  # If database is down, suppress database-related alerts
  - source_match:
      alertname: DatabaseConnectionDown
    target_match:
      service: 'database'
    equal: ['service']
```

### 3. Alert Noise Reduction

```yaml
# Group similar alerts to reduce noise
route:
  group_by: ['alertname', 'service', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  
  # Wait longer before sending duplicate alerts
  repeat_interval: 1h  # Don't resend alerts more than once per hour
```

## Alert Response and Runbooks

### 1. Standardized Runbook Structure

```markdown
# Alert: HighErrorRate

## Description
High error rate detected in backend API

## Immediate Actions
1. Check Grafana dashboard for detailed metrics
2. Review recent deployments
3. Check service dependencies
4. Investigate error patterns in logs

## Investigation Steps
1. Access Kibana to search error logs
2. Check database performance
3. Review API response times
4. Verify third-party service status

## Resolution Steps
1. Rollback recent deployments if needed
2. Scale services if resource-related
3. Fix configuration issues
4. Deploy hotfix if necessary

## Communication
- Update #engineering channel with status
- Notify stakeholders if user-facing
- Document incident in postmortem

## Prevention
- Review error monitoring thresholds
- Implement additional health checks
- Improve testing coverage
```

### 2. Incident Response Process

```
1. Alert Received
   ↓
2. Acknowledge Alert
   ↓
3. Initial Assessment
   ↓
4. Assign Incident Commander
   ↓
5. Investigate and Diagnose
   ↓
6. Implement Resolution
   ↓
7. Verify Resolution
   ↓
8. Post-Incident Review
```

## Monitoring Alert Health

### 1. Alert System Health Metrics

```yaml
# Monitor alert system itself
- alert: AlertManagerDown
  expr: up{job="alertmanager"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "AlertManager is down"

- alert: PrometheusRuleEvaluationFailures
  expr: prometheus_rule_evaluation_failures_total > 0
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Prometheus rule evaluation failures"
```

### 2. Alert Performance Monitoring

- Track alert delivery times
- Monitor notification success rates
- Measure alert acknowledgment times
- Monitor false positive rates

### 3. Regular Alert Reviews

- Monthly alert rule review
- Quarterly escalation policy updates
- Annual notification channel audit
- Continuous improvement based on incidents