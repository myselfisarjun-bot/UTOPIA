import * as SecureStore from 'expo-secure-store';
import type { Session } from '@supabase/supabase-js';

const SESSION_KEY = 'supabase_session';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';
const ACCESS_TOKEN_KEY = 'supabase_access_token';

/**
 * Save session to secure storage
 */
export const saveSession = async (session: Session): Promise<void> => {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
};

/**
 * Retrieve session from secure storage
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
    if (!sessionStr) {
      return null;
    }
    return JSON.parse(sessionStr) as Session;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return null;
  }
};

/**
 * Save access token to secure storage
 */
export const saveAccessToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save access token:', error);
    throw error;
  }
};

/**
 * Retrieve access token from secure storage
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return token || null;
  } catch (error) {
    console.error('Failed to retrieve access token:', error);
    return null;
  }
};

/**
 * Save refresh token to secure storage
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save refresh token:', error);
    throw error;
  }
};

/**
 * Retrieve refresh token from secure storage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token || null;
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
};

/**
 * Clear all auth-related data from secure storage
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
    throw error;
  }
};

/**
 * Check if session exists
 */
export const hasSession = async (): Promise<boolean> => {
  const session = await getSession();
  return !!session;
};
