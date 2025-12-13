import { type NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { OnboardingLayout } from '@/components/OnboardingLayout'
import { PrimaryButton } from '@/components/PrimaryButton'
import { useAuth } from '@/contexts/AuthContext'
import type { RootStackParamList } from '@/navigation/AppNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingPhotos'>

export function OnboardingPhotosScreen({ navigation }: Props) {
  const { photos, onboarding, uploadPhoto, movePhoto, removePhoto, signOut } =
    useAuth()

  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readyPhotos = useMemo(
    () => photos.filter((p) => p.status !== 'error'),
    [photos]
  )

  const pickAndUpload = useMemo(() => {
    return async () => {
      setError(null)

      if (readyPhotos.length >= 6) {
        setError('You can upload up to 6 photos.')
        return
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        setError('Media library permission is required to upload photos.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      })

      if (result.canceled) return

      const asset = result.assets[0]
      if (!asset?.uri) {
        setError('Could not read selected image.')
        return
      }

      setWorking(true)
      try {
        await uploadPhoto(asset.uri)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to upload photo.')
      } finally {
        setWorking(false)
      }
    }
  }, [readyPhotos.length, uploadPhoto])

  return (
    <OnboardingLayout
      title="Add your photos"
      step={3}
      totalSteps={onboarding.steps}
      percent={onboarding.percent}
    >
      <Text style={styles.help}>
        Upload 3–6 photos. You can reorder them; the first photo is shown first.
      </Text>

      <PrimaryButton
        title={working ? 'Uploading…' : 'Add photo'}
        disabled={working}
        onPress={() => pickAndUpload()}
      />

      {working ? <ActivityIndicator /> : null}

      <View style={styles.photoList}>
        {photos.map((photo) => {
          const canMoveUp = photo.sort_order > 0
          const canMoveDown = photo.sort_order < photos.length - 1

          return (
            <View key={photo.id} style={styles.photoRow}>
              <View style={styles.thumbWrap}>
                {photo.localUri ? (
                  <Image source={{ uri: photo.localUri }} style={styles.thumb} />
                ) : (
                  <Text style={styles.thumbPlaceholder}>IMG</Text>
                )}
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.photoMeta}>{`#${photo.sort_order + 1} • ${photo.status ?? 'ready'}`}</Text>

                <View style={styles.row}>
                  <Pressable
                    onPress={() => movePhoto(photo.id, 'up')}
                    disabled={!canMoveUp || working || photo.id.startsWith('local-')}
                    style={({ pressed }) => [
                      styles.smallButton,
                      (!canMoveUp || photo.id.startsWith('local-')) && styles.smallButtonDisabled,
                      pressed && styles.smallButtonPressed,
                    ]}
                  >
                    <Text style={styles.smallButtonText}>Up</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => movePhoto(photo.id, 'down')}
                    disabled={!canMoveDown || working || photo.id.startsWith('local-')}
                    style={({ pressed }) => [
                      styles.smallButton,
                      (!canMoveDown || photo.id.startsWith('local-')) && styles.smallButtonDisabled,
                      pressed && styles.smallButtonPressed,
                    ]}
                  >
                    <Text style={styles.smallButtonText}>Down</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => removePhoto(photo.id)}
                    disabled={working}
                    style={({ pressed }) => [
                      styles.smallDanger,
                      pressed && styles.smallButtonPressed,
                    ]}
                  >
                    <Text style={styles.smallButtonText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton
        title="Finish"
        disabled={working}
        onPress={() => {
          setError(null)
          const nonUploading = photos.filter((p) => p.status !== 'uploading')
          if (nonUploading.length < 3) {
            setError('Please upload at least 3 photos to continue.')
            return
          }
          navigation.reset({ index: 0, routes: [{ name: 'Discovery' }] })
        }}
      />

      <PrimaryButton title="Sign out" onPress={() => signOut()} disabled={working} />
    </OnboardingLayout>
  )
}

const styles = StyleSheet.create({
  help: {
    color: '#4B5563',
  },
  photoList: {
    gap: 10,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    color: '#6B7280',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoMeta: {
    color: '#111827',
    fontWeight: '600',
  },
  smallButton: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  smallDanger: {
    backgroundColor: '#B91C1C',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  smallButtonDisabled: {
    opacity: 0.4,
  },
  smallButtonPressed: {
    opacity: 0.9,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: '#EF4444',
  },
})
