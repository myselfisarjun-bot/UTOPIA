export type Profile = {
  id: string
  name: string | null
  age: number | null
  gender_preference: 'men' | 'women' | 'everyone' | null
  bio: string | null
}

export type Interest = {
  id: string
  name: string
}

export type Photo = {
  id: string
  user_id: string
  path: string
  sort_order: number

  // Client-only fields
  localUri?: string
  status?: 'uploading' | 'ready' | 'error'
}
