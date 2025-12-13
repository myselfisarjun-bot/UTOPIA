import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ENV } from '@/types/env';

let supabaseClient: SupabaseClient | null = null;

export const initializeSupabase = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!SUPABASE_ENV.url || !SUPABASE_ENV.anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }

  supabaseClient = createClient(SUPABASE_ENV.url, SUPABASE_ENV.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return supabaseClient;
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    return initializeSupabase();
  }
  return supabaseClient;
};

export interface QueryOptions {
  offset?: number;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}

/**
 * RLS-safe query helper for read operations
 * Automatically handles errors and returns typed responses
 */
export const queryWithRLS = async <T>(
  tableName: string,
  options: QueryOptions = {}
): Promise<{ data: T[]; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { offset = 0, limit = 100, orderBy = 'created_at', ascending = false } = options;

    const query = client.from(tableName).select('*', { count: 'exact' });

    if (orderBy) {
      query.order(orderBy, { ascending });
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return { data: [], error };
    }

    return { data: (data as T[]) || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
};

/**
 * Insert helper with error handling
 */
export const insertWithRLS = async <T>(
  tableName: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { data: insertedData, error } = await client.from(tableName).insert([data]).select();

    if (error) {
      return { data: null, error };
    }

    return { data: (insertedData?.[0] as T) || null, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

/**
 * Update helper with error handling
 */
export const updateWithRLS = async <T>(
  tableName: string,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { data: updatedData, error } = await client
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select();

    if (error) {
      return { data: null, error };
    }

    return { data: (updatedData?.[0] as T) || null, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

/**
 * Delete helper with error handling
 */
export const deleteWithRLS = async (
  tableName: string,
  id: string
): Promise<{ error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from(tableName).delete().eq('id', id);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};
