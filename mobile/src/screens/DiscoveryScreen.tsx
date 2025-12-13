import { StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '@/components/PrimaryButton'
import { Screen } from '@/components/Screen'
import { useAuth } from '@/contexts/AuthContext'

export function DiscoveryScreen() {
  const { user, profile, onboarding, signOut } = useAuth()

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Discovery</Text>
        <Text style={styles.subtitle}>{`Signed in as ${user?.email ?? user?.id}`}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.body}>{`Onboarding: ${onboarding.percent}%`}</Text>
        <Text style={styles.body}>{`Name: ${profile?.name ?? '-'}`}</Text>

        <PrimaryButton title="Sign out" onPress={() => signOut()} />
      </View>

      {!onboarding.complete ? (
        <Text style={styles.warning}>
          You shouldn't reach discovery without onboarding complete. If you see
          this, restart the app.
        </Text>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#4B5563',
  },
  card: {
    marginTop: 16,
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  body: {
    color: '#111827',
  },
  warning: {
    marginTop: 16,
    color: '#EF4444',
  },
})
