import { getSupabaseClient } from './supabase';
import {
  saveSession,
  getSession,
  clearAuthData,
  saveAccessToken,
  saveRefreshToken,
} from './secureStorage';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    if (data.user && data.session) {
      await saveSession(data.session);
      if (data.session.access_token) {
        await saveAccessToken(data.session.access_token);
      }
      if (data.session.refresh_token) {
        await saveRefreshToken(data.session.refresh_token);
      }

      const user = mapSupabaseUserToAppUser(data.user, displayName);
      return { user, error: null };
    }

    return { user: null, error: new Error('No user or session returned') };
  } catch (err) {
    return { user: null, error: err as Error };
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    if (data.user && data.session) {
      await saveSession(data.session);
      if (data.session.access_token) {
        await saveAccessToken(data.session.access_token);
      }
      if (data.session.refresh_token) {
        await saveRefreshToken(data.session.refresh_token);
      }

      const user = mapSupabaseUserToAppUser(data.user);
      return { user, session: data.session, error: null };
    }

    return { user: null, session: null, error: new Error('No user or session returned') };
  } catch (err) {
    return { user: null, session: null, error: err as Error };
  }
};

/**
 * Sign out
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();

    if (error) {
      return { error };
    }

    await clearAuthData();
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
};

/**
 * Restore session from storage
 */
export const restoreSession = async (): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const session = await getSession();

    if (!session) {
      return { user: null, error: null };
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.setSession(session);

    if (error) {
      await clearAuthData();
      return { user: null, error };
    }

    if (data.user) {
      const user = mapSupabaseUserToAppUser(data.user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

/**
 * Refresh the session
 */
export const refreshSession = async (): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.refreshSession();

    if (error) {
      return { user: null, error };
    }

    if (data.session && data.user) {
      await saveSession(data.session);
      if (data.session.access_token) {
        await saveAccessToken(data.session.access_token);
      }
      if (data.session.refresh_token) {
        await saveRefreshToken(data.session.refresh_token);
      }

      const user = mapSupabaseUserToAppUser(data.user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch (err) {
    return { user: null, error: err as Error };
  }
};

/**
 * Map Supabase user to app user
 */
const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser, displayName?: string): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    displayName: displayName || supabaseUser.user_metadata?.display_name,
    avatar: supabaseUser.user_metadata?.avatar_url,
    createdAt: supabaseUser.created_at,
  };
};

/**
 * Reset password with email
 */
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://example.com/auth/callback',
    });

    return { error: error ? (error as Error) : null };
  } catch (err) {
    return { error: err as Error };
  }
};

/**
 * Update password
 */
export const updatePassword = async (
  newPassword: string
): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { user: null, error };
    }

    if (data.user) {
      const user = mapSupabaseUserToAppUser(data.user);
      return { user, error: null };
    }

    return { user: null, error: null };
  } catch (err) {
    return { user: null, error: err as Error };
  }
};
