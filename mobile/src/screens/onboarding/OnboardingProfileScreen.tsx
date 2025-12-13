import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { OnboardingLayout } from '@/components/OnboardingLayout'
import { PrimaryButton } from '@/components/PrimaryButton'
import { TextField } from '@/components/TextField'
import { useAuth } from '@/contexts/AuthContext'
import type { RootStackParamList } from '@/navigation/AppNavigator'
import { validateProfile } from '@/utils/onboarding'

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingProfile'>

type GenderPref = 'men' | 'women' | 'everyone'

export function OnboardingProfileScreen({ navigation }: Props) {
  const { profile, onboarding, saveProfile, signOut } = useAuth()

  const [name, setName] = useState(profile?.name ?? '')
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '')
  const [genderPreference, setGenderPreference] = useState<GenderPref | ''>(
    (profile?.gender_preference as GenderPref | null) ?? ''
  )
  const [bio, setBio] = useState(profile?.bio ?? '')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const errors = useMemo(() => {
    return validateProfile({
      name,
      age: age ? Number(age) : undefined,
      gender_preference: genderPreference ? genderPreference : undefined,
      bio,
    })
  }, [age, bio, genderPreference, name])

  return (
    <OnboardingLayout
      title="Your profile"
      step={1}
      totalSteps={onboarding.steps}
      percent={onboarding.percent}
    >
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        error={errors.name}
      />
      <TextField
        label="Age"
        value={age}
        onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder="18"
        error={errors.age}
      />

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Gender preference</Text>
        <View style={styles.row}>
          {(['men', 'women', 'everyone'] as GenderPref[]).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setGenderPreference(opt)}
              style={({ pressed }) => [
                styles.chip,
                genderPreference === opt && styles.chipSelected,
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  genderPreference === opt && styles.chipTextSelected,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.gender_preference ? (
          <Text style={styles.errorText}>{errors.gender_preference}</Text>
        ) : null}
      </View>

      <TextField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people a bit about yourself"
        multiline
        error={errors.bio}
      />

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      <PrimaryButton
        title={saving ? 'Saving…' : 'Next'}
        disabled={saving}
        onPress={async () => {
          setFormError(null)

          if (Object.keys(errors).length > 0) {
            setFormError('Please fix the form errors above.')
            return
          }

          setSaving(true)
          try {
            await saveProfile({
              name: name.trim(),
              age: Number(age),
              gender_preference: genderPreference as GenderPref,
              bio: bio.trim(),
            })
            navigation.navigate('OnboardingInterests')
          } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Unable to save profile.')
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
  label: {
    fontWeight: '600',
    color: '#111827',
  },
  row: {
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
  errorText: {
    color: '#EF4444',
  },
})
