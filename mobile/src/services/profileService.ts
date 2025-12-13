import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/models'

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,age,gender_preference,bio')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    return (data as Profile | null) ?? null
  },

  async upsertProfile(userId: string, input: Profile): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          name: input.name,
          age: input.age,
          gender_preference: input.gender_preference,
          bio: input.bio,
        },
        { onConflict: 'id' }
      )
      .select('id,name,age,gender_preference,bio')
      .single()

    if (error) throw error
    return data as Profile
  },
}
