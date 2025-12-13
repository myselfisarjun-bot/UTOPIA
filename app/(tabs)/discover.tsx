import React from 'react';
import { DiscoveryScreenGuard } from '@/screens';

export default function DiscoverTab() {
  const handleNavigateToChat = () => {
    // Navigate to the chat/matches screen when a match occurs
    // For now, we'll just stay on the discover screen
    // In a full implementation, you'd navigate to a matches/chat screen
    console.log('Navigate to chat');
  };

  const handleNavigateToOnboarding = () => {
    // Navigate to onboarding if profile is incomplete
    // In a full implementation, you'd have a proper onboarding route
    console.log('Navigate to onboarding');
  };

  return (
    <DiscoveryScreenGuard
      onNavigateToChat={handleNavigateToChat}
      onNavigateToOnboarding={handleNavigateToOnboarding}
    />
  );
}
