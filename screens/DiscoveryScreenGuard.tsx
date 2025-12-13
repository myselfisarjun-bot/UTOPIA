import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { Button, Text } from '@/components';
import { DiscoveryScreen } from './DiscoveryScreen';

interface DiscoveryScreenGuardProps {
  onNavigateToChat?: () => void;
  onNavigateToOnboarding?: () => void;
}

/**
 * Wrapper around DiscoveryScreen that ensures profile is complete before allowing access
 */
export const DiscoveryScreenGuard: React.FC<DiscoveryScreenGuardProps> = ({
  onNavigateToChat,
  onNavigateToOnboarding,
}) => {
  const theme = useTheme();
  const { isComplete, isLoading, error, score } = useProfileCompleteness();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body1" style={styles.loadingText}>
            Checking profile...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text variant="h5" style={styles.errorText}>
            Unable to check profile status
          </Text>
          <Text variant="body2" color={theme.colors.textSecondary} style={styles.errorMessage}>
            {error.message}
          </Text>
        </View>
      </View>
    );
  }

  if (!isComplete) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <Text variant="h4" style={styles.incompleteTitle}>
            Complete Your Profile
          </Text>
          <Text variant="body1" color={theme.colors.textSecondary} style={styles.incompleteMessage}>
            You need to complete your profile before you can start discovering matches.
          </Text>
          {score !== null && (
            <Text variant="body2" color={theme.colors.textSecondary} style={styles.scoreText}>
              Profile completion: {Math.round(score * 100)}%
            </Text>
          )}
          <Text variant="body2" color={theme.colors.textSecondary} style={styles.requirementsText}>
            Please add:
            {'\n'}• A profile photo
            {'\n'}• Your bio and interests
            {'\n'}• Your age and location
          </Text>
          {onNavigateToOnboarding && (
            <Button
              title="Complete Profile"
              onPress={onNavigateToOnboarding}
              style={styles.completeButton}
            />
          )}
        </View>
      </View>
    );
  }

  return <DiscoveryScreen onNavigateToChat={onNavigateToChat} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
  },
  incompleteTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  incompleteMessage: {
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  requirementsText: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  completeButton: {
    minWidth: 200,
  },
});
