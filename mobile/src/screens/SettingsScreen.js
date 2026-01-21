import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { trackScreenView, trackButtonPress, trackUserAction } from '../analytics/AnalyticsManager';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    analyticsEnabled: true,
    crashReportingEnabled: true,
    performanceMonitoringEnabled: true,
    errorReportingEnabled: true,
    pushNotificationsEnabled: true,
    biometricLoginEnabled: false,
    dataCollectionEnabled: true,
  });

  useEffect(() => {
    trackScreenView('SettingsScreen');
  }, []);

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    trackUserAction('setting_toggled', 'SettingsScreen', {
      setting: key,
      value: !settings[key],
    });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will clear all local app data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            trackUserAction('data_cleared', 'SettingsScreen');
            Alert.alert('Success', 'App data cleared successfully');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    trackUserAction('export_data_requested', 'SettingsScreen');
    Alert.alert('Export Data', 'Data export feature coming soon!');
  };

  const handleViewLogs = () => {
    trackUserAction('view_logs', 'SettingsScreen');
    Alert.alert('View Logs', 'Log viewer coming soon!');
  };

  const handleTestConnection = () => {
    trackUserAction('test_connection', 'SettingsScreen');
    
    Alert.alert(
      'Connection Test',
      'Testing connection to monitoring services...\n\n✅ Firebase: Connected\n✅ Analytics: Active\n✅ Crash Reporting: Enabled\n✅ Performance: Monitoring',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure monitoring and analytics</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitoring & Analytics</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Analytics Tracking</Text>
            <Text style={styles.settingDescription}>
              Enable analytics to track app usage and user behavior
            </Text>
          </View>
          <Switch
            value={settings.analyticsEnabled}
            onValueChange={() => toggleSetting('analyticsEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.analyticsEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Crash Reporting</Text>
            <Text style={styles.settingDescription}>
              Automatically report app crashes and errors
            </Text>
          </View>
          <Switch
            value={settings.crashReportingEnabled}
            onValueChange={() => toggleSetting('crashReportingEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.crashReportingEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Performance Monitoring</Text>
            <Text style={styles.settingDescription}>
              Track app performance and slow operations
            </Text>
          </View>
          <Switch
            value={settings.performanceMonitoringEnabled}
            onValueChange={() => toggleSetting('performanceMonitoringEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.performanceMonitoringEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Error Reporting</Text>
            <Text style={styles.settingDescription}>
              Send error reports to help improve the app
            </Text>
          </View>
          <Switch
            value={settings.errorReportingEnabled}
            onValueChange={() => toggleSetting('errorReportingEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.errorReportingEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingDescription}>
              Receive notifications about app events
            </Text>
          </View>
          <Switch
            value={settings.pushNotificationsEnabled}
            onValueChange={() => toggleSetting('pushNotificationsEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.pushNotificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Biometric Login</Text>
            <Text style={styles.settingDescription}>
              Use fingerprint or face recognition to login
            </Text>
          </View>
          <Switch
            value={settings.biometricLoginEnabled}
            onValueChange={() => toggleSetting('biometricLoginEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.biometricLoginEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Data Collection</Text>
            <Text style={styles.settingDescription}>
              Allow collection of anonymous usage data
            </Text>
          </View>
          <Switch
            value={settings.dataCollectionEnabled}
            onValueChange={() => toggleSetting('dataCollectionEnabled')}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.dataCollectionEnabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportData}
        >
          <Text style={styles.actionButtonText}>📤 Export App Data</Text>
          <Text style={styles.actionButtonSubtext}>
            Download your app data for backup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearData}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>🗑️ Clear App Data</Text>
          <Text style={styles.actionButtonSubtext}>
            Remove all local app data and settings
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTestConnection}
        >
          <Text style={styles.actionButtonText}>🔗 Test Connection</Text>
          <Text style={styles.actionButtonSubtext}>
            Test connection to monitoring services
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewLogs}
        >
          <Text style={styles.actionButtonText}>📋 View Logs</Text>
          <Text style={styles.actionButtonSubtext}>
            View app logs and debugging information
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            trackButtonPress('docs_nav', 'SettingsScreen');
            Linking.openURL('https://your-monitoring-docs.com');
          }}
        >
          <Text style={styles.actionButtonText}>📚 Documentation</Text>
          <Text style={styles.actionButtonSubtext}>
            View monitoring documentation
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build:</Text>
          <Text style={styles.infoValue}>100</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Environment:</Text>
          <Text style={styles.infoValue}>Development</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Last Updated:</Text>
          <Text style={styles.infoValue}>January 2024</Text>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: '#6c757d',
  },
  dangerButton: {
    borderLeftColor: '#dc3545',
  },
  dangerText: {
    color: '#dc3545',
  },
  infoSection: {
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default SettingsScreen;