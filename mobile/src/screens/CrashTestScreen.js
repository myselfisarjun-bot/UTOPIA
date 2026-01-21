import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import { trackScreenView, trackButtonPress, trackCrash } from '../analytics/AnalyticsManager';

const CrashTestScreen = ({ navigation }) => {
  const [crashTest, setCrashTest] = useState(false);

  React.useEffect(() => {
    trackScreenView('CrashTestScreen');
  }, []);

  const handleNativeCrash = () => {
    trackButtonPress('native_crash', 'CrashTestScreen');
    
    Alert.alert(
      'Native Crash Test',
      'This will trigger a native app crash. The app will close and restart automatically.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash App',
          style: 'destructive',
          onPress: () => {
            // Log to crashlytics before crashing
            crashlytics().log('User initiated native crash test');
            crashlytics().setAttributes({
              test_type: 'native_crash',
              timestamp: new Date().toISOString(),
            });
            
            // Track the crash attempt
            trackCrash(new Error('Native crash test initiated by user'));
            
            // This will cause a native crash
            // Note: This will actually crash the app
            crashlytics().crash();
          },
        },
      ]
    );
  };

  const handleJavaScriptCrash = () => {
    trackButtonPress('javascript_crash', 'CrashTestScreen');
    
    Alert.alert(
      'JavaScript Crash Test',
      'This will throw an uncaught JavaScript exception.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Throw Error',
          style: 'destructive',
          onPress: () => {
            // Log to crashlytics
            crashlytics().log('User initiated JavaScript crash test');
            crashlytics().setAttributes({
              test_type: 'javascript_crash',
              timestamp: new Date().toISOString(),
            });
            
            // Track the crash
            trackCrash(new Error('JavaScript crash test initiated by user'));
            
            // Throw an uncaught exception
            throw new Error('JavaScript Crash Test - Uncaught Exception');
          },
        },
      ]
    );
  };

  const handlePromiseRejection = () => {
    trackButtonPress('promise_rejection', 'CrashTestScreen');
    
    Alert.alert(
      'Promise Rejection Test',
      'This will cause an unhandled promise rejection.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Promise',
          style: 'destructive',
          onPress: () => {
            // Log to crashlytics
            crashlytics().log('User initiated promise rejection test');
            crashlytics().setAttributes({
              test_type: 'promise_rejection',
              timestamp: new Date().toISOString(),
            });
            
            // Track the crash
            trackCrash(new Error('Promise rejection test initiated by user'));
            
            // Reject a promise without handling it
            Promise.reject(new Error('Unhandled Promise Rejection Test'));
          },
        },
      ]
    );
  };

  const handleFatalError = () => {
    trackButtonPress('fatal_error', 'CrashTestScreen');
    
    Alert.alert(
      'Fatal Error Test',
      'This will trigger a fatal error that should be reported to Crashlytics.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Error',
          style: 'destructive',
          onPress: () => {
            // Log to crashlytics
            crashlytics().log('User initiated fatal error test');
            crashlytics().setAttributes({
              test_type: 'fatal_error',
              timestamp: new Date().toISOString(),
            });
            
            // Record the error in crashlytics
            crashlytics().recordError(new Error('Fatal Error Test - User initiated'));
            
            // Track the crash
            trackCrash(new Error('Fatal error test initiated by user'));
            
            // Create a fatal error scenario
            setCrashTest(true);
            setTimeout(() => {
              throw new Error('Fatal Error - This should be caught by error boundary');
            }, 100);
          },
        },
      ]
    );
  };

  const handleOutOfMemory = () => {
    trackButtonPress('out_of_memory', 'CrashTestScreen');
    
    Alert.alert(
      'Out of Memory Test',
      'This will attempt to allocate large amounts of memory.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Allocate Memory',
          style: 'destructive',
          onPress: () => {
            // Log to crashlytics
            crashlytics().log('User initiated out of memory test');
            crashlytics().setAttributes({
              test_type: 'out_of_memory',
              timestamp: new Date().toISOString(),
            });
            
            // Track the crash
            trackCrash(new Error('Out of memory test initiated by user'));
            
            // Try to allocate large amounts of memory
            const createMemoryLeak = () => {
              const largeArray = [];
              for (let i = 0; i < 100000; i++) {
                largeArray.push(new Array(10000).fill('memory leak test data'));
              }
              return largeArray;
            };
            
            try {
              createMemoryLeak();
            } catch (error) {
              crashlytics().recordError(error);
              Alert.alert('Memory Test', 'Out of memory error caught and reported!');
            }
          },
        },
      ]
    );
  };

  const handleCrashInfo = () => {
    Alert.alert(
      'Crash Testing Information',
      `📱 Native crashes: App closes completely and restarts
🔄 JavaScript crashes: Caught by error boundary
⚡ Promise rejections: May crash the app depending on handling
💾 Out of memory: Device-dependent, may cause crashes

✅ All crashes will be reported to:
• Firebase Crashlytics
• Sentry (if configured)
• Analytics events

📊 Check your monitoring dashboards for results.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crash Testing</Text>
        <Text style={styles.subtitle}>
          Test crash reporting and error handling
        </Text>
      </View>

      <View style={styles.warningSection}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>Warning</Text>
        <Text style={styles.warningText}>
          These tests will intentionally crash the app or trigger errors.
          Make sure you're in a safe environment and can handle app restarts.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crash Tests</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.nativeButton]}
          onPress={handleNativeCrash}
        >
          <Text style={styles.testButtonText}>📱 Native Crash</Text>
          <Text style={styles.testButtonSubtext}>
            Trigger a native app crash (most severe)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.javascriptButton]}
          onPress={handleJavaScriptCrash}
        >
          <Text style={styles.testButtonText}>⚡ JavaScript Exception</Text>
          <Text style={styles.testButtonSubtext}>
            Throw an uncaught JavaScript error
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.promiseButton]}
          onPress={handlePromiseRejection}
        >
          <Text style={styles.testButtonText}>🔄 Promise Rejection</Text>
          <Text style={styles.testButtonSubtext}>
            Create an unhandled promise rejection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.fatalButton]}
          onPress={handleFatalError}
        >
          <Text style={styles.testButtonText}>💥 Fatal Error</Text>
          <Text style={styles.testButtonSubtext}>
            Trigger a fatal error with context
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.memoryButton]}
          onPress={handleOutOfMemory}
        >
          <Text style={styles.testButtonText}>🧠 Memory Test</Text>
          <Text style={styles.testButtonSubtext}>
            Attempt to allocate excessive memory
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crash Information</Text>
        
        <TouchableOpacity
          style={styles.infoButton}
          onPress={handleCrashInfo}
        >
          <Text style={styles.infoButtonText}>📋 Crash Testing Guide</Text>
          <Text style={styles.infoButtonSubtext}>
            Learn about different crash types and their behavior
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>📊 Monitoring Dashboard</Text>
        <Text style={styles.infoText}>
          After triggering crashes, check these monitoring services:
        </Text>
        
        <View style={styles.dashboardList}>
          <Text style={styles.dashboardItem}>🔥 Firebase Crashlytics Console</Text>
          <Text style={styles.dashboardItem}>🦅 Sentry Dashboard (if configured)</Text>
          <Text style={styles.dashboardItem}>📈 Analytics Events</Text>
          <Text style={styles.dashboardItem}>📱 Mobile App Logs</Text>
        </View>
        
        <Text style={styles.infoText}>
          All crashes are automatically tracked with:
        </Text>
        <View style={styles.dashboardList}>
          <Text style={styles.dashboardItem}>• Timestamp and device info</Text>
          <Text style={styles.dashboardItem}>• Stack traces and error details</Text>
          <Text style={styles.dashboardItem}>• User context (if authenticated)</Text>
          <Text style={styles.dashboardItem}>• App version and build info</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  warningSection: {
    margin: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  nativeButton: {
    borderLeftColor: '#dc3545',
  },
  javascriptButton: {
    borderLeftColor: '#fd7e14',
  },
  promiseButton: {
    borderLeftColor: '#ffc107',
  },
  fatalButton: {
    borderLeftColor: '#6f42c1',
  },
  memoryButton: {
    borderLeftColor: '#20c997',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  testButtonSubtext: {
    fontSize: 12,
    color: '#6c757d',
  },
  infoButton: {
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  infoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoButtonSubtext: {
    fontSize: 12,
    color: '#6c757d',
  },
  infoSection: {
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 16,
  },
  dashboardList: {
    marginLeft: 8,
    marginBottom: 8,
  },
  dashboardItem: {
    fontSize: 11,
    color: '#495057',
    marginBottom: 2,
    lineHeight: 14,
  },
});

export default CrashTestScreen;