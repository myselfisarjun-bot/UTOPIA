import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { trackScreenView, trackButtonPress } from '../analytics/AnalyticsManager';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinDate: '2023-01-15',
    profileViews: 245,
    actions: 1247,
  });

  const [stats, setStats] = useState({
    sessionsToday: 3,
    totalSessions: 127,
    avgSessionDuration: '12m 34s',
    lastActivity: '2 minutes ago',
  });

  useEffect(() => {
    trackScreenView('ProfileScreen');
  }, []);

  const handleEditProfile = () => {
    trackButtonPress('edit_profile', 'ProfileScreen');
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleViewActivity = () => {
    trackButtonPress('view_activity', 'ProfileScreen');
    Alert.alert('Activity Log', 'Activity history coming soon!');
  };

  const handleTestAnalytics = () => {
    trackButtonPress('test_analytics', 'ProfileScreen');
    
    Alert.alert(
      'Analytics Test',
      'Custom analytics event tracked! Check your analytics dashboard.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your account information</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.joinDate}>Member since {user.joinDate}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.profileViews}</Text>
            <Text style={styles.statLabel}>Profile Views</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.actions}</Text>
            <Text style={styles.statLabel}>Total Actions</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.sessionsToday}</Text>
            <Text style={styles.statLabel}>Today's Sessions</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewActivity}
        >
          <Text style={styles.actionButtonIcon}>📊</Text>
          <Text style={styles.actionButtonText}>View Activity Log</Text>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTestAnalytics}
        >
          <Text style={styles.actionButtonIcon}>📈</Text>
          <Text style={styles.actionButtonText}>Test Analytics</Text>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            trackButtonPress('settings_nav', 'ProfileScreen');
            navigation.navigate('Settings');
          }}
        >
          <Text style={styles.actionButtonIcon}>⚙️</Text>
          <Text style={styles.actionButtonText}>Settings</Text>
          <Text style={styles.actionButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>🔐</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Login</Text>
            <Text style={styles.activitySubtitle}>{stats.lastActivity}</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>📊</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Profile Viewed</Text>
            <Text style={styles.activitySubtitle}>15 minutes ago</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityIcon}>⚙️</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Settings Updated</Text>
            <Text style={styles.activitySubtitle}>2 hours ago</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build Number:</Text>
          <Text style={styles.infoValue}>100</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Environment:</Text>
          <Text style={styles.infoValue}>Development</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Analytics:</Text>
          <Text style={styles.infoValue}>Enabled</Text>
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
  profileCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 12,
    color: '#868e96',
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
  statItem: {
    width: '48%',
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
  actionsContainer: {
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  actionButtonArrow: {
    fontSize: 16,
    color: '#6c757d',
  },
  recentActivity: {
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  infoContainer: {
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

export default ProfileScreen;