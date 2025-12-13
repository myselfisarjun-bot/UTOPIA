import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button, Text } from '@/components';

interface OnboardingScreenProps {
  onComplete?: () => void;
}

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome',
    description: 'Welcome to the app. We are excited to have you here.',
    icon: '👋',
  },
  {
    title: 'Get Started',
    description: 'Explore the features and discover what you can do.',
    icon: '🚀',
  },
  {
    title: 'Ready to Go',
    description: "You are all set. Let's start your journey.",
    icon: '✨',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Button
            title="Skip"
            onPress={handleSkip}
            variant="ghost"
            size="small"
            style={styles.skipButton}
          />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>

          <Text variant="h2" style={styles.title}>
            {step.title}
          </Text>

          <Text variant="body1" color={theme.colors.textSecondary} style={styles.description}>
            {step.description}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.surface }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
              onPress={handleNext}
              style={styles.button}
            />
          </View>
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
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});
