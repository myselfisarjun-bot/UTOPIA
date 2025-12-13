import { useEffect, useState } from 'react';
import type { AuthState } from '@/types';
import * as authService from '@/services/auth';

export const useAuth = (): AuthState & {
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} => {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const { user, error } = await authService.restoreSession();

        if (error) {
          setState((prev) => ({
            ...prev,
            session: null,
            user: null,
            error,
            isLoading: false,
          }));
          return;
        }

        if (user) {
          const session = await authService.getCurrentSession();
          setState((prev) => ({
            ...prev,
            session,
            user,
            error: null,
            isLoading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            session: null,
            user: null,
            error: null,
            isLoading: false,
          }));
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          session: null,
          user: null,
          error: err as Error,
          isLoading: false,
        }));
      }
    };

    restoreSession();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user, error } = await authService.signUp(email, password, displayName);

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));
        throw error;
      }

      if (user) {
        const session = await authService.getCurrentSession();
        setState((prev) => ({
          ...prev,
          session,
          user,
          isLoading: false,
          error: null,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err as Error,
      }));
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user, session, error } = await authService.signIn(email, password);

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));
        throw error;
      }

      setState((prev) => ({
        ...prev,
        session: session || prev.session,
        user,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err as Error,
      }));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { error } = await authService.signOut();

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error,
        }));
        throw error;
      }

      setState((prev) => ({
        ...prev,
        session: null,
        user: null,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err as Error,
      }));
      throw err;
    }
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
  };
};
