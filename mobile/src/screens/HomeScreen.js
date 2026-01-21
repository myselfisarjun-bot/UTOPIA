import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { trackScreenView, trackButtonPress } from '../analytics/AnalyticsManager';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 1247,
    activeUsers: 389,
    errorRate: 0.02,
    uptime: 99.9,
  });

  useEffect(() => {
    // Track screen view
    trackScreenView('HomeScreen');
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalUsers: Math.floor(Math.random() * 1000) + 1000,
        activeUsers: Math.floor(Math.random() * 500) + 300,
        errorRate: Math.random() * 0.1,
        uptime: 99.5 + Math.random() * 0.4,
      });
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleFeatureTest = (feature) => {
    trackButtonPress(`${feature}_button`, 'HomeScreen');
    
    switch (feature) {
      case 'analytics':
        Alert.alert(
          'Analytics Test',
          'Analytics event tracked successfully! Check your analytics dashboard.',
          [{ text: 'OK' }]
        );
        break;
      case 'error':
        // Trigger test error
        throw new Error('Test error for monitoring');
      case 'performance':
        // Test performance monitoring
        const start = Date.now();
        setTimeout(() => {
          const duration = Date.now() - start;
          Alert.alert(
            'Performance Test',
            `Operation completed in ${duration}ms`,
            [{ text: 'OK' }]
          );
        }, 100);
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Monitoring Dashboard</Text>
        <Text style={styles.subtitle}>
          Real-time app monitoring & analytics
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeUsers.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(stats.errorRate * 100).toFixed(2)}%</Text>
            <Text style={styles.statLabel}>Error Rate</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.uptime.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Uptime</Text>
          </View>
        </View>
      </View>

      <View style={styles.testsContainer}>
        <Text style={styles.sectionTitle}>Monitoring Tests</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.analyticsButton]}
          onPress={() => handleFeatureTest('analytics')}
        >
          <Text style={styles.testButtonText}>📊 Test Analytics</Text>
          <Text style={styles.testButtonSubtext}>
            Track custom events and user actions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.performanceButton]}
          onPress={() => handleFeatureTest('performance')}
        >
          <Text style={styles.testButtonText}>⚡ Test Performance</Text>
          <Text style={styles.testButtonSubtext}>
            Monitor app performance metrics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.crashButton]}
          onPress={() => handleFeatureTest('error')}
        >
          <Text style={styles.testButtonText}>💥 Test Error Handling</Text>
          <Text style={styles.testButtonSubtext}>
            Test error boundaries and crash reporting
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationContainer}>
        <Text style={styles.sectionTitle}>Navigate</Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            trackButtonPress('profile_nav', 'HomeScreen');
            navigation.navigate('Profile');
          }}
        >
          <Text style={styles.navButtonText}>👤 Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            trackButtonPress('settings_nav', 'HomeScreen');
            navigation.navigate('Settings');
          }}
        >
          <Text style={styles.navButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            trackButtonPress('error_test_nav', 'HomeScreen');
            navigation.navigate('ErrorTest');
          }}
        >
          <Text style={styles.navButtonText}>🧪 Error Testing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            trackButtonPress('crash_test_nav', 'HomeScreen');
            navigation.navigate('CrashTest');
          }}
        >
          <Text style={styles.navButtonText}>💥 Crash Testing</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusDot} />
          <Text style={styles.statusText}>Firebase: Connected</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusDot, styles.statusDotSuccess]} />
          <Text style={styles.statusText}>Analytics: Active</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={[styles.statusDot, styles.statusDotSuccess]} />
          <Text style={styles.statusText}>Crash Reporting: Enabled</Text>
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
  statsContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  testsContainer: {
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
  testButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  analyticsButton: {
    borderLeftColor: '#28a745',
  },
  performanceButton: {
    borderLeftColor: '#ffc107',
  },
  crashButton: {
    borderLeftColor: '#dc3545',
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
  navigationContainer: {
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
  navButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  statusContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
    marginRight: 8,
  },
  statusDotSuccess: {
    backgroundColor: '#28a745',
  },
  statusText: {
    fontSize: 14,
    color: '#495057',
  },
});

export default HomeScreen;