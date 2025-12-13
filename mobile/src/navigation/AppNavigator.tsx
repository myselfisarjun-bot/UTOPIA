import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'

import { useAuth } from '@/contexts/AuthContext'
import { AuthScreen } from '@/screens/AuthScreen'
import { DiscoveryScreen } from '@/screens/DiscoveryScreen'
import { LoadingScreen } from '@/screens/LoadingScreen'
import { OnboardingInterestsScreen } from '@/screens/onboarding/OnboardingInterestsScreen'
import { OnboardingPhotosScreen } from '@/screens/onboarding/OnboardingPhotosScreen'
import { OnboardingProfileScreen } from '@/screens/onboarding/OnboardingProfileScreen'

export type RootStackParamList = {
  Auth: undefined
  OnboardingProfile: undefined
  OnboardingInterests: undefined
  OnboardingPhotos: undefined
  Discovery: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
  const { session, initializing, onboardingLoading, onboarding } = useAuth()

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  const isSignedIn = !!session

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        {!isSignedIn ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: 'Sign in' }}
          />
        ) : onboardingLoading ? (
          <Stack.Screen
            name="Discovery"
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
        ) : onboarding.complete ? (
          <Stack.Screen
            name="Discovery"
            component={DiscoveryScreen}
            options={{ title: 'Discovery' }}
          />
        ) : (
          <>
            <Stack.Screen
              name="OnboardingProfile"
              component={OnboardingProfileScreen}
              options={{ title: 'Onboarding' }}
            />
            <Stack.Screen
              name="OnboardingInterests"
              component={OnboardingInterestsScreen}
              options={{ title: 'Onboarding' }}
            />
            <Stack.Screen
              name="OnboardingPhotos"
              component={OnboardingPhotosScreen}
              options={{ title: 'Onboarding' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
