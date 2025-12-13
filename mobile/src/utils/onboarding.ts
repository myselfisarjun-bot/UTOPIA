import type { Photo, Profile } from '@/types/models'

export function validateProfile(profile: Partial<Profile>) {
  const errors: Record<string, string> = {}

  if (!profile.name || profile.name.trim().length < 2) {
    errors.name = 'Name is required (min 2 characters).'
  }

  if (typeof profile.age !== 'number' || Number.isNaN(profile.age)) {
    errors.age = 'Age is required.'
  } else if (profile.age < 18) {
    errors.age = 'You must be at least 18.'
  } else if (profile.age > 120) {
    errors.age = 'Please enter a valid age.'
  }

  if (!profile.gender_preference) {
    errors.gender_preference = 'Please select a preference.'
  }

  if (!profile.bio || profile.bio.trim().length < 10) {
    errors.bio = 'Bio is required (min 10 characters).'
  }

  return errors
}

export function isProfileComplete(profile: Profile | null) {
  if (!profile) return false
  return Object.keys(validateProfile(profile)).length === 0
}

export function areInterestsComplete(interestIds: string[]) {
  return interestIds.length > 0
}

export function arePhotosComplete(photos: Photo[]) {
  return photos.filter((p) => p.status !== 'uploading').length >= 3
}

export function getOnboardingProgress(params: {
  profile: Profile | null
  interestIds: string[]
  photos: Photo[]
}) {
  const { profile, interestIds, photos } = params

  const steps = 3
  const completed = [
    isProfileComplete(profile),
    areInterestsComplete(interestIds),
    arePhotosComplete(photos),
  ].filter(Boolean).length

  return {
    steps,
    completed,
    percent: Math.round((completed / steps) * 100),
  }
}
