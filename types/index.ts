import type { Session } from '@supabase/supabase-js';

export type { Session };

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: Error | null;
}
