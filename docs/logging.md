# Log Aggregation and Analysis Guide

This guide explains how to use the log aggregation and analysis system for centralized logging and troubleshooting.

## Overview

The log aggregation system includes:
- **Elasticsearch**: Log storage and indexing
- **Kibana**: Log visualization and search
- **Logstash**: Log processing and parsing
- **Fluentd/Fluent Bit**: Log collection agents

## Log Sources

### Backend Application Logs

1. **Application Logs**:
   - Error logs with stack traces
   - Request/response logs with timing
   - Database query logs
   - Authentication logs
   - Business logic event logs

2. **Access Logs**:
   - HTTP requests and responses
   - API endpoint usage
   - Response times and status codes
   - Geographic distribution

3. **System Logs**:
   - Application startup and shutdown
   - Configuration changes
   - Resource usage
   - Security events

### Mobile Application Logs

1. **App Logs**:
   - User interactions and screen navigation
   - Performance metrics
   - Error and crash reports
   - Feature usage events

2. **Analytics Logs**:
   - Custom event tracking
   - User behavior analysis
   - A/B testing results
   - Conversion funnel data

### Infrastructure Logs

1. **Container Logs**:
   - Docker container output
   - Kubernetes pod logs
   - Service mesh logs
   - Load balancer logs

2. **System Logs**:
   - Server system logs
   - Database logs
   - Network logs
   - Security logs

## Log Analysis with Kibana

### 1. Discovering Logs

**Basic Search**:
```
# Search for error logs
level:error

# Search for specific time range
@timestamp:[2024-01-15T10:00:00 TO 2024-01-15T11:00:00]

# Search for specific service
service:backend AND level:error

# Search for mobile crashes
service:mobile AND tags:crash
```

**Advanced Search**:
```
# Complex search with multiple conditions
level:error AND (service:backend OR service:mobile) 
AND @timestamp:[now-1h TO now]

# Search with wildcards
message:"*database*connection*error*"

# Search for specific IP addresses
clientip:192.168.1.1

# Search for specific users
userId:"user_123" AND action:"login"
```

### 2. Creating Visualizations

**Error Rate Visualization**:
1. Create new visualization in Kibana
2. Select "Line chart"
3. Configure query:
   ```
   level:error
   ```
4. Set Y-axis to "Count"
5. Set X-axis to "@timestamp" with date histogram

**Service Performance Visualization**:
1. Create "Area chart"
2. Query:
   ```
   service:backend AND message:"response_time"
   ```
3. Extract response time from message field
4. Create aggregations for percentiles

**User Activity Visualization**:
1. Create "Pie chart"
2. Query:
   ```
   service:mobile AND eventName:"user_action"
   ```
3. Group by action field
4. Show count of each action type

### 3. Creating Dashboards

**Backend Performance Dashboard**:
- Response time trends
- Error rate charts
- Database query performance
- API endpoint usage
- Geographic distribution of requests

**Mobile Analytics Dashboard**:
- User session data
- Screen view statistics
- Feature usage patterns
- Crash reports analysis
- User retention metrics

**Infrastructure Monitoring Dashboard**:
- Container resource usage
- System performance metrics
- Network traffic patterns
- Security event tracking
- Log volume trends

## Log Parsing and Structure

### 1. Backend Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "backend",
  "message": "API request processed",
  "requestId": "req_123",
  "method": "POST",
  "url": "/api/users",
  "statusCode": 200,
  "responseTime": 245,
  "userId": "user_456",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "context": {
    "database": "MongoDB",
    "cache": "Redis",
    "operation": "user_create"
  }
}
```

### 2. Mobile Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "mobile",
  "eventName": "screen_view",
  "screenName": "ProfileScreen",
  "userId": "user_456",
  "deviceInfo": {
    "platform": "iOS",
    "model": "iPhone 12",
    "osVersion": "15.1",
    "appVersion": "1.0.0"
  },
  "sessionId": "sess_789",
  "context": {
    "navigation": "from:HomeScreen to:ProfileScreen",
    "duration": 156
  }
}
```

### 3. Error Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "service": "backend",
  "message": "Database connection failed",
  "error": {
    "name": "MongoNetworkError",
    "message": "connect ECONNREFUSED 127.0.0.1:27017",
    "stack": "MongoNetworkError: connect ECONNREFUSED..."
  },
  "requestId": "req_123",
  "userId": "user_456",
  "context": {
    "database": "mongodb",
    "operation": "findOne",
    "collection": "users",
    "query": {"email": "test@example.com"}
  }
}
```

## Log Retention and Management

### 1. Retention Policies

**Hot Tier (Recent Data)**:
- Duration: 7 days
- Storage: SSD storage
- Access: Frequent queries and dashboards
- Cost: Higher but necessary for operations

**Warm Tier (Recent Archive)**:
- Duration: 30 days
- Storage: Standard storage
- Access: Occasional analysis and investigation
- Cost: Moderate

**Cold Tier (Long-term Archive)**:
- Duration: 1 year
- Storage: Archive storage
- Access: Rare compliance and historical analysis
- Cost: Low

### 2. Index Lifecycle Management

```json
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_size": "10GB",
            "max_age": "1d"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "set_priority": {
            "priority": 50
          },
          "allocate": {
            "number_of_replicas": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "set_priority": {
            "priority": 0
          },
          "allocate": {
            "number_of_replicas": 0
          }
        }
      },
      "delete": {
        "min_age": "365d"
      }
    }
  }
}
```

## Log Security and Compliance

### 1. PII Protection

**Automatic PII Detection**:
```javascript
// Logstash filter to detect and mask PII
filter {
  if [message] =~ /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ {
    mutate {
      add_tag => [ "pii_email" ]
    }
    mutate {
      gsub => [ "message", "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "[EMAIL_MASKED]" ]
    }
  }
  
  if [message] =~ /\b\d{3}-\d{2}-\d{4}\b/ {
    mutate {
      add_tag => [ "pii_ssn" ]
    }
    mutate {
      gsub => [ "message", "\b\d{3}-\d{2}-\d{4}\b", "[SSN_MASKED]" ]
    }
  }
}
```

### 2. Access Control

**Role-Based Access**:
- **Operations Team**: Full access to operational logs
- **Development Team**: Application logs, limited system logs
- **Security Team**: Security-related logs, compliance logs
- **Management**: Aggregated metrics and reports only

### 3. Audit Logging

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "eventType": "log_access",
  "userId": "admin_user_123",
  "action": "search",
  "query": "level:error AND service:backend",
  "resultsCount": 150,
  "ip": "192.168.1.100",
  "userAgent": "Kibana/8.8.0",
  "compliance": {
    "retention": "1year",
    "classification": "operational",
    "piiPresent": false
  }
}
```

## Troubleshooting with Logs

### 1. Common Log Patterns

**Database Connection Issues**:
```bash
# Search for database connection errors
service:backend AND (MongoNetworkError OR ConnectionError OR timeout)

# Filter for specific time range
service:backend AND level:error AND @timestamp:[2024-01-15T10:00:00 TO 2024-01-15T10:30:00]
```

**Performance Issues**:
```bash
# Search for slow requests
service:backend AND responseTime:>1000

# Find slowest endpoints
service:backend AND url:"/api/*" | group by url, avg(responseTime)
```

**Authentication Problems**:
```bash
# Failed login attempts
service:(backend OR mobile) AND action:login AND level:error

# Suspicious activity patterns
service:mobile AND userId:* AND level:error | group by userId, count
```

### 2. Log Correlation

**Request Tracing**:
```
# Use requestId to trace requests across services
requestId:req_123 | sort by @timestamp
```

**User Journey Analysis**:
```
# Track user actions across time
userId:user_456 AND @timestamp:[2024-01-15T10:00:00 TO 2024-01-15T11:00:00] | sort by @timestamp
```

### 3. Performance Analysis

**Response Time Analysis**:
```javascript
// Elasticsearch aggregation for response time percentiles
{
  "aggs": {
    "response_time_stats": {
      "histogram": {
        "field": "responseTime",
        "interval": 100
      },
      "aggs": {
        "percentiles": {
          "percentiles": {
            "field": "responseTime",
            "percents": [50, 90, 95, 99]
          }
        }
      }
    }
  }
}
```

## Log Analysis Automation

### 1. Automated Alerts

**Error Rate Alerts**:
```yaml
- alert: HighErrorRate
  expr: |
    increase(log_entries{level="error"}[5m]) > 10
  annotations:
    summary: "High error rate detected in logs"
    description: "{{ $value }} errors per minute"
```

**Security Event Alerts**:
```yaml
- alert: SecurityEvents
  expr: |
    increase(log_entries{tags="security"}[5m]) > 5
  annotations:
    summary: "Multiple security events detected"
    description: "{{ $value }} security events in 5 minutes"
```

### 2. Log-Based Metrics

**Business Metrics Extraction**:
```javascript
// Extract business metrics from logs
{
  "aggs": {
    "user_registrations": {
      "filter": {
        "bool": {
          "must": [
            {"term": {"eventName": "user_register"}},
            {"range": {"@timestamp": {"gte": "now-1d"}}}
          ]
        }
      }
    },
    "feature_usage": {
      "terms": {
        "field": "properties.featureName",
        "size": 10
      }
    }
  }
}
```

### 3. Machine Learning for Log Analysis

**Anomaly Detection**:
- Detect unusual error patterns
- Identify performance anomalies
- Find unexpected user behavior
- Alert on log volume changes

**Log Clustering**:
- Group similar errors together
- Identify trending issues
- Reduce alert noise
- Prioritize incident response

## Best Practices

### 1. Log Format Standards

- Use structured logging (JSON)
- Include timestamps in ISO 8601 format
- Add correlation IDs for tracing
- Use consistent field names
- Include contextual information

### 2. Performance Optimization

- Use appropriate log levels
- Avoid logging sensitive information
- Optimize log parsing pipelines
- Monitor log ingestion rates
- Set up proper indexing strategies

### 3. Cost Management

- Implement log retention policies
- Archive old logs to cheaper storage
- Monitor storage usage
- Optimize query performance
- Use log sampling for high-volume sources

### 4. Quality Assurance

- Test log parsing rules regularly
- Validate log formats before deployment
- Monitor for parsing errors
- Set up log health checks
- Document log schemas and standards