import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Text } from '@/components';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const theme = useTheme();
  const { signIn, signUp, isLoading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      onAuthSuccess?.();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text variant="body2" color={theme.colors.textSecondary} style={styles.subtitle}>
            {isSignUp ? 'Sign up to get started' : 'Sign in to continue to your account'}
          </Text>
        </View>

        <Card style={styles.card}>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text variant="label" style={styles.label}>
                Display Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="John Doe"
                placeholderTextColor={theme.colors.placeholder}
                value={displayName}
                onChangeText={setDisplayName}
                editable={!isLoading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text variant="label" style={styles.label}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="your@email.com"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text variant="label" style={styles.label}>
              Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.placeholder}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.colors.errorLight }]}>
              <Text variant="caption" color={theme.colors.error}>
                {error.message}
              </Text>
            </View>
          )}

          <Button
            title={isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            style={styles.submitButton}
          />

          <View style={styles.toggleContainer}>
            <Text variant="body2" color={theme.colors.textSecondary}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <Button
              title={isSignUp ? 'Sign In' : 'Sign Up'}
              onPress={() => setIsSignUp(!isSignUp)}
              variant="ghost"
              size="small"
              style={styles.toggleButton}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
  },
  card: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    padding: 0,
  },
});
