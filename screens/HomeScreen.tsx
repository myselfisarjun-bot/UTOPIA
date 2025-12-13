import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button, Card, Text } from '@/components';
import { useAuth } from '@/hooks/useAuth';

interface HomeScreenProps {
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const theme = useTheme();
  const { user, signOut, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      onLogout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="h1">Home</Text>
        </View>

        <Card style={styles.userCard}>
          <Text variant="h4" style={styles.userCardTitle}>
            {user?.displayName || user?.email || 'Welcome User'}
          </Text>
          <Text variant="body2" color={theme.colors.textSecondary} style={styles.userCardEmail}>
            {user?.email}
          </Text>
        </Card>

        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Getting Started
          </Text>
          <Card style={styles.featureCard}>
            <Text variant="h6">Explore Features</Text>
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.featureText}>
              Discover what you can do with this app.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text variant="h6">Your Profile</Text>
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.featureText}>
              Manage your account settings and preferences.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text variant="h6">Help & Support</Text>
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.featureText}>
              Get help with any questions or issues.
            </Text>
          </Card>
        </View>

        <View style={styles.footer}>
          <Button
            title={isLoading ? 'Signing out...' : 'Sign Out'}
            onPress={handleLogout}
            disabled={isLoading}
            loading={isLoading}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  userCard: {
    marginBottom: 24,
  },
  userCardTitle: {
    marginBottom: 4,
  },
  userCardEmail: {
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  featureCard: {
    marginBottom: 12,
  },
  featureText: {
    marginTop: 4,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  logoutButton: {
    marginBottom: 16,
  },
});
