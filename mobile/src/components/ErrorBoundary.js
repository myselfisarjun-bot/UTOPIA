import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import { analyticsManager, ANALYTICS_EVENTS } from '../analytics/AnalyticsManager';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to Crashlytics
    crashlytics().recordError(error);
    
    // Log additional context
    crashlytics().log(`Error Boundary Error: ${error.message}`);
    crashlytics().log(`Component Stack: ${errorInfo.componentStack}`);
    
    // Track error in analytics
    analyticsManager.trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });

    // Log additional attributes
    crashlytics().setAttributes({
      error_boundary: 'true',
      retry_count: this.state.retryCount.toString(),
      timestamp: new Date().toISOString(),
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Track retry attempt
    analyticsManager.trackEvent('error_boundary_retry', {
      retry_count: this.state.retryCount + 1,
      previous_error: this.state.error?.message,
    });
  };

  handleReload = () => {
    // Force app reload (this is a simple implementation)
    // In a real app, you might want to use a more sophisticated approach
    crashlytics().log('User requested app reload from error boundary');
    
    analyticsManager.trackEvent('error_boundary_reload', {
      retry_count: this.state.retryCount,
    });

    // For React Native, we can use the following approach
    // This will restart the entire app
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      // For native apps, you might want to navigate to a specific screen
      // or implement a more sophisticated recovery mechanism
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              An unexpected error occurred. Our team has been notified automatically.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.devErrorInfo}>
                <Text style={styles.devErrorTitle}>Development Error Info:</Text>
                <Text style={styles.devErrorText}>{this.state.error.message}</Text>
                {this.state.error.stack && (
                  <Text style={styles.devErrorStack}>{this.state.error.stack}</Text>
                )}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
                disabled={this.state.retryCount >= 3}
              >
                <Text style={styles.buttonText}>
                  {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.reloadButton]}
                onPress={this.handleReload}
              >
                <Text style={styles.buttonText}>Reload App</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helpText}>
              If this problem persists, please contact support.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 320,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  devErrorInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  devErrorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  devErrorText: {
    fontSize: 11,
    color: '#495057',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  devErrorStack: {
    fontSize: 10,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
  },
  reloadButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#868e96',
    textAlign: 'center',
  },
});

export default ErrorBoundary;