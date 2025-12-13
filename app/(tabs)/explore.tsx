import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card, Text } from '@/components';

export default function ExploreScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="h3" style={styles.title}>
          Features & API Reference
        </Text>

        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Authentication
          </Text>
          <Card style={styles.featureCard}>
            <Text variant="h6">Sign Up & Sign In</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              useAuth() - Complete auth state management
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Secure Storage</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              saveSession, getSession, clearAuthData helpers
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Password Reset</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              resetPassword, updatePassword methods
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Supabase Integration
          </Text>
          <Card style={styles.featureCard}>
            <Text variant="h6">Query Helpers</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              queryWithRLS - RLS-safe read operations
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Data Operations</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              insertWithRLS, updateWithRLS, deleteWithRLS
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Client Management</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              getSupabaseClient, initializeSupabase
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Theme System
          </Text>
          <Card style={styles.featureCard}>
            <Text variant="h6">Colors</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              Light/dark modes with semantic colors
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Typography</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              h1-h6, body1-body2, labels, captions
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Spacing</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              xs (4), sm (8), md (12), lg (16), xl (20), etc.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h5" style={styles.sectionTitle}>
            Components
          </Text>
          <Card style={styles.featureCard}>
            <Text variant="h6">Button</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              Variants: primary, secondary, outline, ghost
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Card</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              Elevated cards with border and theme support
            </Text>
          </Card>
          <Card style={styles.featureCard}>
            <Text variant="h6">Text</Text>
            <Text variant="caption" color={theme.colors.textSecondary}>
              Theme-aware typography component
            </Text>
          </Card>
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
  title: {
    marginBottom: 24,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#8B7355',
  },
  featureCard: {
    marginBottom: 8,
  },
});
