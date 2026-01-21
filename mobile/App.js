import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Import monitoring and analytics
import { initializeMonitoring } from './src/monitoring/MonitoringManager';
import { trackScreenView } from './src/analytics/AnalyticsManager';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ErrorScreen from './src/screens/ErrorScreen';
import CrashTestScreen from './src/screens/CrashTestScreen';

// Import navigation theme
import { navigationTheme } from './src/theme/navigation';

// Initialize monitoring services
initializeMonitoring();

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer
      theme={navigationTheme}
      onStateChange={(state) => {
        // Track screen navigation for analytics
        const currentRoute = state?.routes[state.index];
        if (currentRoute) {
          trackScreenView(currentRoute.name);
        }
      }}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Monitored App' }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Login' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="ErrorTest" 
          component={ErrorScreen}
          options={{ title: 'Error Testing' }}
        />
        <Stack.Screen 
          name="CrashTest" 
          component={CrashTestScreen}
          options={{ title: 'Crash Testing' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AppNavigator />
  );
};

export default App;