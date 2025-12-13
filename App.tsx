import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { RealtimeService } from './src/services/realtime';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: AsyncStorage has been extracted from react-native',
  'Setting a timer for a long period of time',
]);

export default function App() {
  useEffect(() => {
    // Cleanup realtime connections when app closes
    return () => {
      RealtimeService.cleanup();
    };
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
