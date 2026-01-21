import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { monitoring } from '../monitoring/MonitoringManager';

// Analytics event constants
export const ANALYTICS_EVENTS = {
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_CLOSED: 'app_closed',
  APP_FOREGROUND: 'app_foreground',
  APP_BACKGROUND: 'app_background',
  
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTER_SUCCESS: 'register_success',
  REGISTER_FAILED: 'register_failed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  
  // User engagement
  SCREEN_VIEW: 'screen_view',
  BUTTON_PRESS: 'button_press',
  USER_ACTION: 'user_action',
  FEATURE_USED: 'feature_used',
  
  // Content interactions
  CONTENT_VIEWED: 'content_viewed',
  CONTENT_SHARED: 'content_shared',
  CONTENT_LIKED: 'content_liked',
  CONTENT_COMMENTED: 'content_commented',
  SEARCH_PERFORMED: 'search_performed',
  
  // E-commerce (if applicable)
  PRODUCT_VIEWED: 'product_viewed',
  ADD_TO_CART: 'add_to_cart',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',
  
  // Error tracking
  ERROR_OCCURRED: 'error_occurred',
  CRASH_REPORTED: 'crash_reported',
  
  // Performance
  SLOW_OPERATION: 'slow_operation',
  NETWORK_ERROR: 'network_error',
} as const;

// User properties
export const USER_PROPERTIES = {
  USER_TYPE: 'user_type',
  SUBSCRIPTION_STATUS: 'subscription_status',
  DEVICE_TYPE: 'device_type',
  APP_VERSION: 'app_version',
  FIRST_APP_OPEN: 'first_app_open',
  LAST_APP_OPEN: 'last_app_open',
} as const;

class AnalyticsManager {
  constructor() {
    this.isInitialized = false;
    this.eventQueue = [];
    this.userProperties = new Map();
  }

  async initialize() {
    try {
      console.log('Initializing analytics manager...');
      
      // Set default user properties
      await this.setDefaultUserProperties();
      
      this.isInitialized = true;
      console.log('Analytics manager initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      crashlytics().recordError(error);
    }
  }

  async setDefaultUserProperties() {
    try {
      const deviceInfo = await this.getDeviceInfo();
      
      await analytics().setUserProperties({
        [USER_PROPERTIES.DEVICE_TYPE]: deviceInfo.model,
        [USER_PROPERTIES.APP_VERSION]: deviceInfo.appVersion,
      });
    } catch (error) {
      console.error('Failed to set default user properties:', error);
    }
  }

  async getDeviceInfo() {
    const DeviceInfo = require('react-native-device-info');
    const VersionNumber = require('react-native-version-number');
    
    return {
      model: await DeviceInfo.getModel(),
      version: DeviceInfo.getVersion(),
      appVersion: VersionNumber.appVersion,
      buildNumber: VersionNumber.buildVersion,
    };
  }

  // Screen tracking
  async trackScreenView(screenName, screenClass = null) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });

      console.log(`Screen view tracked: ${screenName}`);
    } catch (error) {
      console.error('Failed to track screen view:', error);
      crashlytics().recordError(error);
    }
  }

  // Event tracking
  async trackEvent(eventName, parameters = {}) {
    try {
      if (!this.isInitialized) {
        console.warn('Analytics not initialized, queuing event:', eventName);
        this.eventQueue.push({ eventName, parameters, timestamp: Date.now() });
        return;
      }

      // Add timestamp and platform info
      const eventParams = {
        ...parameters,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      };

      await analytics().logEvent(eventName, eventParams);
      
      console.log(`Event tracked: ${eventName}`, parameters);
    } catch (error) {
      console.error('Failed to track event:', error);
      crashlytics().recordError(error);
    }
  }

  // User properties
  async setUserProperty(name, value) {
    try {
      await analytics().setUserProperty(name, value.toString());
      this.userProperties.set(name, value);
      console.log(`User property set: ${name} = ${value}`);
    } catch (error) {
      console.error('Failed to set user property:', error);
      crashlytics().recordError(error);
    }
  }

  async setUserProperties(properties) {
    try {
      await analytics().setUserProperties(properties);
      
      Object.entries(properties).forEach(([key, value]) => {
        this.userProperties.set(key, value);
      });
      
      console.log('User properties set:', properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
      crashlytics().recordError(error);
    }
  }

  // Authentication events
  async trackLoginSuccess(userId, method = 'email') {
    await this.trackEvent(ANALYTICS_EVENTS.LOGIN_SUCCESS, {
      user_id: userId,
      method,
    });

    await this.setUserProperty(USER_PROPERTIES.LAST_APP_OPEN, new Date().toISOString());
  }

  async trackLoginFailed(error, method = 'email') {
    await this.trackEvent(ANALYTICS_EVENTS.LOGIN_FAILED, {
      method,
      error_message: error.message || error.toString(),
    });
  }

  async trackLogout() {
    await this.trackEvent(ANALYTICS_EVENTS.LOGOUT);
  }

  async trackRegisterSuccess(userId, method = 'email') {
    await this.trackEvent(ANALYTICS_EVENTS.REGISTER_SUCCESS, {
      user_id: userId,
      method,
    });

    await this.setUserProperty(USER_PROPERTIES.FIRST_APP_OPEN, new Date().toISOString());
  }

  async trackRegisterFailed(error, method = 'email') {
    await this.trackEvent(ANALYTICS_EVENTS.REGISTER_FAILED, {
      method,
      error_message: error.message || error.toString(),
    });
  }

  // User engagement
  async trackButtonPress(buttonName, screenName) {
    await this.trackEvent(ANALYTICS_EVENTS.BUTTON_PRESS, {
      button_name: buttonName,
      screen_name: screenName,
    });
  }

  async trackUserAction(action, screenName, details = {}) {
    await this.trackEvent(ANALYTICS_EVENTS.USER_ACTION, {
      action,
      screen_name: screenName,
      ...details,
    });
  }

  async trackFeatureUsed(featureName, screenName) {
    await this.trackEvent(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: featureName,
      screen_name: screenName,
    });
  }

  // Content interactions
  async trackContentViewed(contentId, contentType, screenName) {
    await this.trackEvent(ANALYTICS_EVENTS.CONTENT_VIEWED, {
      content_id: contentId,
      content_type: contentType,
      screen_name: screenName,
    });
  }

  async trackContentShared(contentId, contentType, method) {
    await this.trackEvent(ANALYTICS_EVENTS.CONTENT_SHARED, {
      content_id: contentId,
      content_type: contentType,
      method,
    });
  }

  async trackContentLiked(contentId, contentType) {
    await this.trackEvent(ANALYTICS_EVENTS.CONTENT_LIKED, {
      content_id: contentId,
      content_type: contentType,
    });
  }

  async trackSearchPerformed(query, resultsCount) {
    await this.trackEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      search_query: query,
      results_count: resultsCount,
    });
  }

  // E-commerce events
  async trackProductViewed(productId, productName, category) {
    await this.trackEvent(ANALYTICS_EVENTS.PRODUCT_VIEWED, {
      product_id: productId,
      product_name: productName,
      category,
    });
  }

  async trackAddToCart(productId, productName, price, quantity) {
    await this.trackEvent(ANALYTICS_EVENTS.ADD_TO_CART, {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
    });
  }

  async trackPurchaseCompleted(transactionId, items, totalAmount, currency) {
    await this.trackEvent(ANALYTICS_EVENTS.PURCHASE_COMPLETED, {
      transaction_id: transactionId,
      items: JSON.stringify(items),
      total_amount: totalAmount,
      currency,
    });
  }

  async trackPurchaseFailed(error, transactionId) {
    await this.trackEvent(ANALYTICS_EVENTS.PURCHASE_FAILED, {
      transaction_id: transactionId,
      error_message: error.message || error.toString(),
    });
  }

  // Error tracking
  async trackError(error, context = {}) {
    await this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      error_message: error.message || error.toString(),
      error_stack: error.stack,
      context: JSON.stringify(context),
    });
  }

  async trackCrash(exception) {
    await this.trackEvent(ANALYTICS_EVENTS.CRASH_REPORTED, {
      exception_message: exception.message,
      exception_stack: exception.stack,
    });
  }

  // Performance tracking
  async trackSlowOperation(operationName, duration, threshold) {
    await this.trackEvent(ANALYTICS_EVENTS.SLOW_OPERATION, {
      operation_name: operationName,
      duration,
      threshold,
    });
  }

  async trackNetworkError(url, error) {
    await this.trackEvent(ANALYTICS_EVENTS.NETWORK_ERROR, {
      url,
      error_message: error.message || error.toString(),
    });
  }

  // Process queued events
  async processEventQueue() {
    if (this.eventQueue.length === 0) return;

    console.log(`Processing ${this.eventQueue.length} queued events...`);
    
    for (const event of this.eventQueue) {
      try {
        await analytics().logEvent(event.eventName, {
          ...event.parameters,
          timestamp: new Date(event.timestamp).toISOString(),
        });
      } catch (error) {
        console.error('Failed to process queued event:', error);
      }
    }
    
    this.eventQueue = [];
    console.log('Event queue processed');
  }

  // Get analytics data (for debugging)
  async getAnalyticsData() {
    try {
      // This would typically be implemented with a backend analytics service
      // For now, return mock data
      return {
        events_tracked: this.eventQueue.length + (this.isInitialized ? 1 : 0),
        user_properties: Object.fromEntries(this.userProperties),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      return null;
    }
  }
}

// Create singleton instance
export const analyticsManager = new AnalyticsManager();

// Export convenience functions
export const trackScreenView = (screenName, screenClass) => 
  analyticsManager.trackScreenView(screenName, screenClass);

export const trackEvent = (eventName, parameters) => 
  analyticsManager.trackEvent(eventName, parameters);

export const trackButtonPress = (buttonName, screenName) => 
  analyticsManager.trackButtonPress(buttonName, screenName);

export const trackUserAction = (action, screenName, details) => 
  analyticsManager.trackUserAction(action, screenName, details);

export const trackFeatureUsed = (featureName, screenName) => 
  analyticsManager.trackFeatureUsed(featureName, screenName);

export const trackLoginSuccess = (userId, method) => 
  analyticsManager.trackLoginSuccess(userId, method);

export const trackLoginFailed = (error, method) => 
  analyticsManager.trackLoginFailed(error, method);

export const trackLogout = () => 
  analyticsManager.trackLogout();

export const trackRegisterSuccess = (userId, method) => 
  analyticsManager.trackRegisterSuccess(userId, method);

export const trackRegisterFailed = (error, method) => 
  analyticsManager.trackRegisterFailed(error, method);

export const trackError = (error, context) => 
  analyticsManager.trackError(error, context);

export default analyticsManager;