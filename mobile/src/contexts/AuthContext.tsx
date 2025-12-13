import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as AuthSession from 'expo-auth-session'
import * as Linking from 'expo-linking'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { getAuthRedirectUrl } from '@/utils/authRedirect'
import {
  areInterestsComplete,
  arePhotosComplete,
  getOnboardingProgress,
  isProfileComplete,
} from '@/utils/onboarding'
import type { Photo, Profile } from '@/types/models'
import { interestService } from '@/services/interestService'
import { photoService } from '@/services/photoService'
import { profileService } from '@/services/profileService'

type AuthContextValue = {
  session: Session | null
  user: User | null
  initializing: boolean
  onboardingLoading: boolean

  profile: Profile | null
  interestIds: string[]
  photos: Photo[]

  onboarding: {
    steps: number
    completed: number
    percent: number
    complete: boolean
  }

  signInWithGoogle: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>

  saveProfile: (updates: Partial<Profile>) => Promise<void>
  saveInterests: (interestIds: string[]) => Promise<void>

  uploadPhoto: (localUri: string) => Promise<void>
  movePhoto: (photoId: string, direction: 'up' | 'down') => Promise<void>
  removePhoto: (photoId: string) => Promise<void>

  refreshOnboarding: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function handleAuthRedirectUrl(url: string) {
  const parsed = Linking.parse(url)
  const qp = parsed.queryParams ?? {}

  const code = qp.code
  const accessToken = qp.access_token
  const refreshToken = qp.refresh_token

  if (typeof code === 'string') {
    await supabase.auth.exchangeCodeForSession(code)
    return
  }

  if (typeof accessToken === 'string' && typeof refreshToken === 'string') {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)

  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [interestIds, setInterestIds] = useState<string[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])

  const user = session?.user ?? null
  const redirectTo = useMemo(() => getAuthRedirectUrl(), [])
  const isHandlingInitialUrl = useRef(false)

  const onboarding = useMemo(() => {
    const progress = getOnboardingProgress({ profile, interestIds, photos })

    return {
      ...progress,
      complete:
        isProfileComplete(profile) &&
        areInterestsComplete(interestIds) &&
        arePhotosComplete(photos),
    }
  }, [interestIds, photos, profile])

  useEffect(() => {
    let isMounted = true

    async function init() {
      try {
        const { data } = await supabase.auth.getSession()
        if (isMounted) setSession(data.session)
      } finally {
        if (isMounted) setInitializing(false)
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleAuthRedirectUrl(url).catch(() => {
        // Ignore errors; UI will show auth state changes if successful.
      })
    })

    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (isHandlingInitialUrl.current) return
    isHandlingInitialUrl.current = true

    Linking.getInitialURL()
      .then((url) => {
        if (!url) return
        return handleAuthRedirectUrl(url)
      })
      .catch(() => {
        // Ignore
      })
  }, [])

  const refreshOnboarding = useMemo(() => {
    return async () => {
      if (!user) return
      setOnboardingLoading(true)

      try {
        const [p, i, ph] = await Promise.all([
          profileService.getProfile(user.id),
          interestService.getUserInterestIds(user.id),
          photoService.listPhotos(user.id),
        ])

        setProfile(p)
        setInterestIds(i)
        setPhotos(ph)
      } finally {
        setOnboardingLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setInterestIds([])
      setPhotos([])
      return
    }

    refreshOnboarding().catch(() => {
      // Ignore
    })
  }, [refreshOnboarding, user])

  const signInWithGoogle = useMemo(() => {
    return async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error
      if (!data.url) throw new Error('Supabase did not return an OAuth URL.')

      const result = await AuthSession.startAsync({
        authUrl: data.url,
        returnUrl: redirectTo,
      })

      if (result.type === 'success') {
        const code = result.params?.code
        if (typeof code === 'string') {
          await supabase.auth.exchangeCodeForSession(code)
        }
      }
    }
  }, [redirectTo])

  const sendMagicLink = useMemo(() => {
    return async (email: string) => {
      const normalized = email.trim().toLowerCase()
      if (!normalized) throw new Error('Email is required.')

      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: redirectTo,
        },
      })

      if (error) throw error
    }
  }, [redirectTo])

  const signOut = useMemo(() => {
    return async () => {
      await supabase.auth.signOut()
    }
  }, [])

  const saveProfile = useMemo(() => {
    return async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not signed in.')

      const prev = profile
      const optimistic: Profile = {
        id: user.id,
        name: updates.name ?? prev?.name ?? null,
        age: updates.age ?? prev?.age ?? null,
        gender_preference:
          updates.gender_preference ?? prev?.gender_preference ?? null,
        bio: updates.bio ?? prev?.bio ?? null,
      }

      setProfile(optimistic)

      try {
        const saved = await profileService.upsertProfile(user.id, optimistic)
        setProfile(saved)
      } catch (e) {
        setProfile(prev ?? null)
        throw e
      }
    }
  }, [profile, user])

  const saveInterests = useMemo(() => {
    return async (nextIds: string[]) => {
      if (!user) throw new Error('Not signed in.')

      const prev = interestIds
      setInterestIds(nextIds)

      try {
        await interestService.setUserInterests(user.id, nextIds)
      } catch (e) {
        setInterestIds(prev)
        try {
          await interestService.setUserInterests(user.id, prev)
        } catch {
          // ignore rollback errors
        }
        throw e
      }
    }
  }, [interestIds, user])

  const uploadPhoto = useMemo(() => {
    return async (localUri: string) => {
      if (!user) throw new Error('Not signed in.')

      const tempId = `local-${Date.now()}`
      const nextOrder = photos.length

      const optimistic: Photo = {
        id: tempId,
        user_id: user.id,
        path: '',
        sort_order: nextOrder,
        localUri,
        status: 'uploading',
      }

      setPhotos((prev) => [...prev, optimistic])

      try {
        const created = await photoService.uploadLocalPhoto({
          userId: user.id,
          localUri,
          sortOrder: nextOrder,
        })

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === tempId
              ? { ...created, localUri, status: 'ready' }
              : p
          )
        )
      } catch (e) {
        setPhotos((prev) => prev.filter((p) => p.id !== tempId))
        throw e
      }
    }
  }, [photos.length, user])

  const movePhoto = useMemo(() => {
    return async (photoId: string, direction: 'up' | 'down') => {
      const idx = photos.findIndex((p) => p.id === photoId)
      if (idx === -1) return

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= photos.length) return

      const prev = photos
      const next = [...photos]
      const temp = next[idx]
      next[idx] = next[targetIdx]
      next[targetIdx] = temp

      const normalized = next.map((p, i) => ({ ...p, sort_order: i }))
      setPhotos(normalized)

      try {
        await photoService.updatePhotoOrders(
          normalized
            .filter((p) => !p.id.startsWith('local-'))
            .map((p) => ({ id: p.id, sort_order: p.sort_order }))
        )
      } catch (e) {
        setPhotos(prev)
        throw e
      }
    }
  }, [photos])

  const removePhoto = useMemo(() => {
    return async (photoId: string) => {
      if (!user) throw new Error('Not signed in.')

      const prev = photos
      const target = photos.find((p) => p.id === photoId)
      if (!target) return

      const next = photos
        .filter((p) => p.id !== photoId)
        .map((p, idx) => ({ ...p, sort_order: idx }))

      setPhotos(next)

      try {
        if (!photoId.startsWith('local-')) {
          await photoService.deletePhoto({ photoId, path: target.path })
          await photoService.updatePhotoOrders(
            next
              .filter((p) => !p.id.startsWith('local-'))
              .map((p) => ({ id: p.id, sort_order: p.sort_order }))
          )
        }
      } catch (e) {
        setPhotos(prev)
        throw e
      }
    }
  }, [photos, user])

  const value: AuthContextValue = {
    session,
    user,
    initializing,
    onboardingLoading,
    profile,
    interestIds,
    photos,
    onboarding,
    signInWithGoogle,
    sendMagicLink,
    signOut,
    saveProfile,
    saveInterests,
    uploadPhoto,
    movePhoto,
    removePhoto,
    refreshOnboarding,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
