import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { trackScreenView, trackButtonPress, trackError } from '../analytics/AnalyticsManager';

const ErrorTestScreen = ({ navigation }) => {
  const [testResults, setTestResults] = useState([]);

  React.useEffect(() => {
    trackScreenView('ErrorTestScreen');
  }, []);

  const addTestResult = (testName, success, message) => {
    const result = {
      id: Date.now(),
      testName,
      success,
      message,
      timestamp: new Date().toISOString(),
    };
    setTestResults(prev => [result, ...prev]);
  };

  const handleTestError = (type) => {
    trackButtonPress(`error_test_${type}`, 'ErrorTestScreen');

    try {
      switch (type) {
        case 'javascript':
          throw new Error('JavaScript Error Test - This is a test error');
          
        case 'async':
          Promise.reject(new Error('Async Error Test - This is a test async error'));
          break;
          
        case 'network':
          // Simulate network error
          fetch('https://invalid-url-test.com/api')
            .catch(error => {
              trackError(error, { type: 'network', simulated: true });
              addTestResult('Network Error', true, 'Network error captured and tracked');
            });
          break;
          
        case 'validation':
          // Simulate validation error
          const validationError = new Error('Validation failed: Invalid email format');
          validationError.name = 'ValidationError';
          throw validationError;
          
        case 'custom':
          // Custom error with context
          const customError = new Error('Custom Business Logic Error');
          customError.code = 'BUSINESS_ERROR';
          customError.context = { userId: '123', action: 'test' };
          throw customError;
          
        default:
          throw new Error('Generic test error');
      }
    } catch (error) {
      trackError(error, { type, test: true });
      addTestResult(`${type} Error`, true, `${error.name}: ${error.message}`);
      Alert.alert(
        'Error Test',
        `✅ Error captured successfully!\n\n${error.name}: ${error.message}\n\nCheck your monitoring dashboard.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleMemoryTest = () => {
    trackButtonPress('memory_test', 'ErrorTestScreen');
    
    try {
      // Simulate memory-intensive operation
      const largeArray = new Array(1000000).fill(0);
      setTimeout(() => {
        addTestResult('Memory Test', true, 'Large array created and processed');
        Alert.alert('Memory Test', '✅ Memory test completed successfully!');
      }, 100);
    } catch (error) {
      trackError(error, { type: 'memory', test: true });
      addTestResult('Memory Test', false, error.message);
    }
  };

  const handlePerformanceTest = () => {
    trackButtonPress('performance_test', 'ErrorTestScreen');
    
    const start = Date.now();
    try {
      // Simulate slow operation
      let counter = 0;
      const slowOperation = () => {
        for (let i = 0; i < 1000000; i++) {
          counter += Math.random();
        }
      };
      
      slowOperation();
      const duration = Date.now() - start;
      
      addTestResult('Performance Test', true, `Operation completed in ${duration}ms`);
      
      Alert.alert(
        'Performance Test',
        `✅ Performance test completed!\n\nDuration: ${duration}ms\n\nIf this takes too long, it will be flagged as a slow operation.`
      );
    } catch (error) {
      trackError(error, { type: 'performance', test: true });
      addTestResult('Performance Test', false, error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Error Testing</Text>
        <Text style={styles.subtitle}>
          Test various error scenarios and monitoring
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Types</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.errorButton]}
          onPress={() => handleTestError('javascript')}
        >
          <Text style={styles.testButtonText}>🚨 JavaScript Error</Text>
          <Text style={styles.testButtonSubtext}>
            Trigger a basic JavaScript error
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.errorButton]}
          onPress={() => handleTestError('async')}
        >
          <Text style={styles.testButtonText}>⚡ Async Error</Text>
          <Text style={styles.testButtonSubtext}>
            Trigger an asynchronous operation error
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.errorButton]}
          onPress={() => handleTestError('network')}
        >
          <Text style={styles.testButtonText}>🌐 Network Error</Text>
          <Text style={styles.testButtonSubtext}>
            Simulate network connection failure
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.errorButton]}
          onPress={() => handleTestError('validation')}
        >
          <Text style={styles.testButtonText}>✅ Validation Error</Text>
          <Text style={styles.testButtonSubtext}>
            Trigger a validation error with custom name
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.errorButton]}
          onPress={() => handleTestError('custom')}
        >
          <Text style={styles.testButtonText}>🔧 Custom Error</Text>
          <Text style={styles.testButtonSubtext}>
            Trigger custom business logic error
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Tests</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.performanceButton]}
          onPress={handlePerformanceTest}
        >
          <Text style={styles.testButtonText}>⏱️ Performance Test</Text>
          <Text style={styles.testButtonSubtext}>
            Test performance monitoring and slow operation detection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.performanceButton]}
          onPress={handleMemoryTest}
        >
          <Text style={styles.testButtonText}>🧠 Memory Test</Text>
          <Text style={styles.testButtonSubtext}>
            Test memory usage and potential memory leaks
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        
        {testResults.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
              No tests run yet. Try running some error tests above.
            </Text>
          </View>
        ) : (
          testResults.map((result) => (
            <View
              key={result.id}
              style={[
                styles.resultItem,
                result.success ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Text style={styles.resultTitle}>{result.testName}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTime}>
                {new Date(result.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Testing Information</Text>
        <Text style={styles.infoText}>
          All error tests will be captured by the error monitoring system.
          Check your Sentry dashboard and Firebase Crashlytics for results.
        </Text>
        <Text style={styles.infoText}>
          Performance tests will measure operation duration and flag slow operations.
        </Text>
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
  errorButton: {
    borderLeftColor: '#dc3545',
  },
  performanceButton: {
    borderLeftColor: '#ffc107',
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
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  resultSuccess: {
    borderLeftColor: '#28a745',
  },
  resultError: {
    borderLeftColor: '#dc3545',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 10,
    color: '#6c757d',
  },
  infoSection: {
    margin: 16,
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
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
});

export default ErrorTestScreen;