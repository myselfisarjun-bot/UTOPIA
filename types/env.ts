export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export const SUPABASE_ENV: SupabaseEnv = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};
