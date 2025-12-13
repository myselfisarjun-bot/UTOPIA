import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from '@/contexts/AuthContext'
import { AppNavigator } from '@/navigation/AppNavigator'

WebBrowser.maybeCompleteAuthSession()

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
