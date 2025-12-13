import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Text } from '@/components';

export default function HomeScreen() {
  const theme = useTheme();
  const { user, signOut, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <Text variant="h6">Theme System</Text>
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.featureText}>
              Using our custom theme with dark/light support.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text variant="h6">Supabase Integration</Text>
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.featureText}>
              Fully configured with authentication and RLS helpers.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text variant="h6">Navigation Shells</Text>
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.featureText}>
              Auth, Onboarding, App core, and Modals all set up.
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
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
