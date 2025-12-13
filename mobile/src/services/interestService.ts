import { supabase } from '@/lib/supabase'
import type { Interest } from '@/types/models'

export const interestService = {
  async listInterests(): Promise<Interest[]> {
    const { data, error } = await supabase
      .from('interests')
      .select('id,name')
      .order('name', { ascending: true })

    if (error) throw error
    return (data as Interest[]) ?? []
  },

  async getUserInterestIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_interests')
      .select('interest_id')
      .eq('user_id', userId)

    if (error) throw error

    return ((data as Array<{ interest_id: string }>) ?? []).map((r) => r.interest_id)
  },

  async setUserInterests(userId: string, interestIds: string[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)

    if (deleteError) throw deleteError

    if (interestIds.length === 0) return

    const { error: insertError } = await supabase.from('user_interests').insert(
      interestIds.map((interestId) => ({
        user_id: userId,
        interest_id: interestId,
      }))
    )

    if (insertError) throw insertError
  },
}
