import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '@/components/PrimaryButton'
import { Screen } from '@/components/Screen'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/contexts/AuthContext'

export function AuthScreen() {
  const { signInWithGoogle, sendMagicLink } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<null | 'google' | 'magic'>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <Screen>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Sign in with Google or request a magic link.
      </Text>

      <View style={styles.card}>
        <PrimaryButton
          title={loading === 'google' ? 'Opening…' : 'Continue with Google'}
          disabled={!!loading}
          onPress={async () => {
            setError(null)
            setNotice(null)
            setLoading('google')
            try {
              await signInWithGoogle()
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Google sign-in failed.')
            } finally {
              setLoading(null)
            }
          }}
        />

        <View style={styles.divider} />

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="you@example.com"
        />

        <PrimaryButton
          title={loading === 'magic' ? 'Sending…' : 'Send magic link'}
          disabled={!!loading}
          onPress={async () => {
            setError(null)
            setNotice(null)
            setLoading('magic')
            try {
              await sendMagicLink(email)
              setNotice('Check your email for a sign-in link.')
            } catch (e) {
              setError(
                e instanceof Error ? e.message : 'Unable to send magic link.'
              )
            } finally {
              setLoading(null)
            }
          }}
        />

        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>

      <Text style={styles.footer}>
        Tip: In development, ensure your Supabase redirect URLs include the Expo
        redirect URI.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    color: '#4B5563',
  },
  card: {
    marginTop: 16,
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  error: {
    color: '#EF4444',
  },
  notice: {
    color: '#10B981',
  },
  footer: {
    marginTop: 18,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
  },
})
