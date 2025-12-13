import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { OnboardingLayout } from '@/components/OnboardingLayout'
import { PrimaryButton } from '@/components/PrimaryButton'
import { useAuth } from '@/contexts/AuthContext'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import type { Interest } from '@/types/models'
import { interestService } from '@/services/interestService'

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingInterests'>

export function OnboardingInterestsScreen({ navigation }: Props) {
  const { interestIds, onboarding, saveInterests, signOut } = useAuth()

  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<string[]>(interestIds)

  useEffect(() => {
    setSelected(interestIds)
  }, [interestIds])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    interestService
      .listInterests()
      .then((data) => {
        if (!mounted) return
        setInterests(data)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Unable to load interests.')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const toggle = useMemo(() => {
    return (id: string) => {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    }
  }, [])

  return (
    <OnboardingLayout
      title="Pick your interests"
      step={2}
      totalSteps={onboarding.steps}
      percent={onboarding.percent}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.grid}>
          {interests.map((interest) => {
            const isSelected = selected.includes(interest.id)
            return (
              <Pressable
                key={interest.id}
                onPress={() => toggle(interest.id)}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextSelected]}
                >
                  {interest.name}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title={saving ? 'Saving…' : 'Next'}
        disabled={saving || loading}
        onPress={async () => {
          setError(null)

          if (selected.length === 0) {
            setError('Please pick at least one interest.')
            return
          }

          setSaving(true)
          try {
            await saveInterests(selected)
            navigation.navigate('OnboardingPhotos')
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to save interests.')
          } finally {
            setSaving(false)
          }
        }}
      />

      <PrimaryButton title="Sign out" onPress={() => signOut()} disabled={saving} />
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipText: {
    color: '#111827',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  error: {
    color: '#EF4444',
  },
})
