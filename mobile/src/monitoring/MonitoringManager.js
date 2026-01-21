import crashlytics from '@react-native-firebase/crashlytics';
import perf from '@react-native-firebase/perf';
import analytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';
import VersionNumber from 'react-native-version-number';

// Configuration
const CONFIG = {
  enableCrashReporting: __DEV__ !== true,
  enableAnalytics: true,
  enablePerformance: true,
  enableErrorReporting: true,
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id',
    measurementId: 'G-XXXXXXXXXX',
  },
  sentry: {
    dsn: 'your-sentry-dsn',
    environment: __DEV__ ? 'development' : 'production',
  }
};

// Error boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Crashlytics
    crashlytics().recordError(error);
    crashlytics().log(`Error Boundary: ${error.message}`);
    crashlytics().log(`Component Stack: ${errorInfo.componentStack}`);
    
    // Log additional context
    crashlytics().setAttributes({
      component: errorInfo.componentStack.includes('Home') ? 'Home' : 'Unknown',
      timestamp: new Date().toISOString(),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
            Something went wrong!
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 24 }}>
            An unexpected error occurred. Our team has been notified.
          </Text>
          <Button
            title="Try Again"
            onPress={() => {
              this.setState({ hasError: false, error: null });
            }}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Main monitoring manager
export class MonitoringManager {
  static instance = null;

  static getInstance() {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  constructor() {
    this.isInitialized = false;
    this.performanceTraces = new Map();
    this.customMetrics = new Map();
  }

  async initialize() {
    try {
      console.log('Initializing monitoring services...');
      
      // Initialize Firebase if not already done
      // Note: This should be done in your main app file using @react-native-firebase/app
      
      await this.initializeCrashReporting();
      await this.initializeAnalytics();
      await this.initializePerformance();
      await this.initializeDeviceInfo();
      
      this.isInitialized = true;
      console.log('Monitoring services initialized successfully');
      
      // Log successful initialization
      crashlytics().log('App monitoring initialized successfully');
      analytics().logEvent('monitoring_initialized', {
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      crashlytics().recordError(error);
    }
  }

  async initializeCrashReporting() {
    if (!CONFIG.enableCrashReporting) {
      console.log('Crash reporting disabled in development');
      return;
    }

    try {
      // Set user identifier
      const userId = await this.getCurrentUserId();
      if (userId) {
        crashlytics().setUserId(userId);
      }

      // Set additional attributes
      await crashlytics().setAttributes({
        app_version: VersionNumber.appVersion,
        build_number: VersionNumber.buildVersion,
        platform: Platform.OS,
        environment: __DEV__ ? 'development' : 'production',
      });

      console.log('Crash reporting initialized');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  async initializeAnalytics() {
    if (!CONFIG.enableAnalytics) {
      console.log('Analytics disabled');
      return;
    }

    try {
      // Set user properties if user is authenticated
      const userId = await this.getCurrentUserId();
      if (userId) {
        await analytics().setUserId(userId);
      }

      // Set user properties
      const deviceInfo = await this.getDeviceInfo();
      await analytics().setUserProperties({
        platform: Platform.OS,
        device_model: deviceInfo.model,
        app_version: VersionNumber.appVersion,
        build_number: VersionNumber.buildVersion,
      });

      console.log('Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  async initializePerformance() {
    if (!CONFIG.enablePerformance) {
      console.log('Performance monitoring disabled');
      return;
    }

    try {
      // Performance monitoring is automatically enabled with @react-native-firebase/perf
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  async initializeDeviceInfo() {
    try {
      const deviceInfo = await this.getDeviceInfo();
      this.customMetrics.set('device_info', deviceInfo);
    } catch (error) {
      console.error('Failed to get device info:', error);
    }
  }

  async getDeviceInfo() {
    return {
      model: await DeviceInfo.getModel(),
      version: await DeviceInfo.getSystemVersion(),
      manufacturer: await DeviceInfo.getManufacturer(),
      appVersion: VersionNumber.appVersion,
      buildNumber: VersionNumber.buildVersion,
      isTablet: await DeviceInfo.isTablet(),
      hasNotch: await DeviceInfo.hasNotch(),
      totalMemory: await DeviceInfo.getTotalMemory(),
      freeDiskStorage: await DeviceInfo.getFreeDiskStorage(),
    };
  }

  async getCurrentUserId() {
    // This should return the current authenticated user ID
    // Implement based on your auth system
    try {
      // For demo purposes, return null
      return null;
    } catch (error) {
      return null;
    }
  }

  // Custom event tracking
  async trackEvent(eventName, parameters = {}) {
    try {
      if (this.isInitialized && CONFIG.enableAnalytics) {
        await analytics().logEvent(eventName, {
          ...parameters,
          timestamp: new Date().toISOString(),
          platform: Platform.OS,
          app_version: VersionNumber.appVersion,
        });
      }
    } catch (error) {
      console.error('Failed to track event:', error);
      crashlytics().recordError(error);
    }
  }

  // Screen view tracking
  async trackScreen(screenName) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });

      // Also track as custom event
      await this.trackEvent('screen_view', {
        screen_name: screenName,
      });
    } catch (error) {
      console.error('Failed to track screen view:', error);
    }
  }

  // Performance tracing
  startTrace(traceName) {
    if (!CONFIG.enablePerformance) return null;

    const trace = perf().startTrace(traceName);
    this.performanceTraces.set(traceName, trace);
    return trace;
  }

  stopTrace(traceName) {
    const trace = this.performanceTraces.get(traceName);
    if (trace) {
      trace.stop();
      this.performanceTraces.delete(traceName);
    }
  }

  // Custom metrics
  setCustomMetric(key, value) {
    this.customMetrics.set(key, value);
  }

  getCustomMetric(key) {
    return this.customMetrics.get(key);
  }

  // Error reporting
  recordError(error, context = {}) {
    try {
      if (CONFIG.enableCrashReporting) {
        crashlytics().recordError(error);
        
        // Add context
        crashlytics().setAttributes({
          context: JSON.stringify(context),
          error_timestamp: new Date().toISOString(),
        });
      }
      
      console.error('Error recorded:', error, context);
    } catch (reportingError) {
      console.error('Failed to record error:', reportingError);
    }
  }

  // User action tracking
  async trackUserAction(action, parameters = {}) {
    await this.trackEvent('user_action', {
      action,
      ...parameters,
    });
  }

  // App lifecycle tracking
  async trackAppStateChange(state) {
    await this.trackEvent('app_state_change', {
      app_state: state,
    });
  }

  // Memory warning handling
  async handleMemoryWarning() {
    await this.trackEvent('memory_warning', {
      timestamp: new Date().toISOString(),
    });
  }

  // Custom logs for debugging
  log(message, level = 'info', extra = {}) {
    try {
      if (CONFIG.enableCrashReporting) {
        crashlytics().log(`${level.toUpperCase()}: ${message}`);
        
        if (Object.keys(extra).length > 0) {
          crashlytics().log(`Extra: ${JSON.stringify(extra)}`);
        }
      }
      
      console.log(`[${level.toUpperCase()}] ${message}`, extra);
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringManager.getInstance();

// Initialize monitoring when module loads
monitoring.initialize();

// Initialize function for app startup
export const initializeMonitoring = async () => {
  await monitoring.initialize();
};