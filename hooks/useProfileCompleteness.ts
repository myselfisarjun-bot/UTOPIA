import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/services/supabase';

interface ProfileCompletenessResult {
  isComplete: boolean;
  isLoading: boolean;
  error: Error | null;
  score: number | null;
}

/**
 * Hook to check if the user's profile is complete enough for discovery
 */
export const useProfileCompleteness = (): ProfileCompletenessResult => {
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const checkCompleteness = async () => {
      try {
        setIsLoading(true);
        const client = getSupabaseClient();

        const {
          data: { user },
        } = await client.auth.getUser();

        if (!user) {
          setIsComplete(false);
          setError(new Error('Not authenticated'));
          setIsLoading(false);
          return;
        }

        // Check if profile exists
        const { data: profile, error: profileError } = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          setIsComplete(false);
          setError(profileError ? new Error(profileError.message) : null);
          setIsLoading(false);
          return;
        }

        // Get profile completeness score
        const { data: completenessScore, error: scoreError } = await client.rpc(
          'profile_completeness_score',
          {
            p_user_id: user.id,
          }
        );

        if (scoreError) {
          setError(new Error(scoreError.message));
        } else {
          setScore(completenessScore);
          // Consider profile complete if score >= 0.7 (70%)
          setIsComplete(completenessScore >= 0.7);
        }

        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsComplete(false);
        setIsLoading(false);
      }
    };

    checkCompleteness();
  }, []);

  return {
    isComplete,
    isLoading,
    error,
    score,
  };
};
