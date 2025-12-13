import { getSupabaseClient } from './supabase';
import type {
  DiscoveryCandidate,
  Profile,
  ProfilePhoto,
  UserInterest,
  LikeResult,
} from '@/types/discovery';

export interface GetDiscoveryCandidatesParams {
  limit?: number;
  offset?: number;
  maxDistanceKm?: number;
  photoExpiresIn?: number;
}

export interface GetProfileDetailsParams {
  profileId: string;
}

/**
 * Fetch discovery candidates using the Supabase RPC
 */
export const getDiscoveryCandidates = async (
  params: GetDiscoveryCandidatesParams = {}
): Promise<{ data: DiscoveryCandidate[]; error: Error | null }> => {
  try {
    const client = getSupabaseClient();
    const { limit = 10, offset = 0, maxDistanceKm = 100, photoExpiresIn = 3600 } = params;

    const { data, error } = await client.rpc('get_discovery_candidates', {
      p_limit: limit,
      p_offset: offset,
      p_max_distance_km: maxDistanceKm,
      p_photo_expires_in: photoExpiresIn,
    });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
};

/**
 * Get profile details including photos and interests
 */
export const getProfileDetails = async (
  params: GetProfileDetailsParams
): Promise<{
  profile: Profile | null;
  photos: ProfilePhoto[];
  interests: UserInterest[];
  error: Error | null;
}> => {
  try {
    const client = getSupabaseClient();
    const { profileId } = params;

    // Fetch profile
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      return { profile: null, photos: [], interests: [], error: new Error(profileError.message) };
    }

    // Fetch photos
    const { data: photos } = await client
      .from('photos')
      .select('*')
      .eq('user_id', profileId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    // Fetch interests
    const { data: interests } = await client
      .from('user_interests')
      .select('user_id, interest_id, interests(name)')
      .eq('user_id', profileId);

    const formattedInterests =
      interests?.map((i: any) => ({
        user_id: i.user_id,
        interest_id: i.interest_id,
        interest_name: i.interests?.name,
      })) || [];

    return {
      profile: profile as Profile,
      photos: (photos || []) as ProfilePhoto[],
      interests: formattedInterests,
      error: null,
    };
  } catch (err) {
    return { profile: null, photos: [], interests: [], error: err as Error };
  }
};

/**
 * Like a profile
 */
export const likeProfile = async (
  likedId: string
): Promise<{ data: LikeResult | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Check if we can like (daily limit)
    const { data: canLike, error: canLikeError } = await client.rpc('can_like', {
      p_liker_id: user.id,
      p_limit: null,
    });

    if (canLikeError) {
      return { data: null, error: new Error(canLikeError.message) };
    }

    if (!canLike) {
      return {
        data: null,
        error: new Error('Daily like limit reached. Try again tomorrow!'),
      };
    }

    // Insert the like
    const { error: likeError } = await client.from('likes').insert({
      liker_id: user.id,
      liked_id: likedId,
    });

    if (likeError) {
      if (likeError.message.includes('daily like limit exceeded')) {
        return {
          data: null,
          error: new Error('Daily like limit reached. Try again tomorrow!'),
        };
      }
      return { data: null, error: new Error(likeError.message) };
    }

    // Check if there's a match (the other person liked us)
    const { data: reverselike } = await client
      .from('likes')
      .select('*')
      .eq('liker_id', likedId)
      .eq('liked_id', user.id)
      .single();

    let isMatch = false;
    let matchId: string | undefined;

    if (reverselike) {
      // There's a mutual like, check for match
      const user1 = user.id < likedId ? user.id : likedId;
      const user2 = user.id > likedId ? user.id : likedId;

      const { data: match } = await client
        .from('matches')
        .select('*')
        .eq('user1', user1)
        .eq('user2', user2)
        .single();

      if (match) {
        isMatch = true;
        matchId = match.id;
      }
    }

    // Get remaining likes count
    const { data: likesToday } = await client
      .from('likes')
      .select('id', { count: 'exact', head: false })
      .eq('liker_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const likesCount = likesToday?.length || 0;
    const { data: dailyLimit } = await client.rpc('daily_like_limit');
    const limit = dailyLimit || 50;

    return {
      data: {
        is_match: isMatch,
        match_id: matchId,
        likes_remaining: Math.max(0, limit - likesCount),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
};

/**
 * Get daily likes remaining
 */
export const getDailyLikesRemaining = async (): Promise<{
  remaining: number;
  limit: number;
  error: Error | null;
}> => {
  try {
    const client = getSupabaseClient();

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return { remaining: 0, limit: 0, error: new Error('Not authenticated') };
    }

    // Get daily limit
    const { data: dailyLimit } = await client.rpc('daily_like_limit');
    const limit = dailyLimit || 50;

    // Get likes today
    const { data: likesToday } = await client
      .from('likes')
      .select('id', { count: 'exact', head: false })
      .eq('liker_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const likesCount = likesToday?.length || 0;

    return {
      remaining: Math.max(0, limit - likesCount),
      limit,
      error: null,
    };
  } catch (err) {
    return { remaining: 0, limit: 0, error: err as Error };
  }
};

/**
 * Pass on a profile (no database action needed, just skip in UI)
 */
export const passProfile = async (profileId: string): Promise<{ error: Error | null }> => {
  // No database action needed for pass
  // Could be extended to track passes if needed
  return { error: null };
};

/**
 * Block a user
 */
export const blockUser = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    const client = getSupabaseClient();

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    // Check if there's a match
    const user1 = user.id < userId ? user.id : userId;
    const user2 = user.id > userId ? user.id : userId;

    const { error: updateError } = await client
      .from('matches')
      .update({ status: 'blocked' })
      .eq('user1', user1)
      .eq('user2', user2);

    if (updateError) {
      return { error: new Error(updateError.message) };
    }

    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

/**
 * Report a user (placeholder - would need reporting system in DB)
 */
export const reportUser = async (
  userId: string,
  reason: string
): Promise<{ error: Error | null }> => {
  try {
    // In a real app, this would insert into a reports table
    // For now, just log it
    console.warn('User report:', { userId, reason });
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
};

/**
 * Get signed URL for a photo
 */
export const getPhotoSignedUrl = async (
  photoId: string
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client.rpc('mint_photo_signed_url', {
      p_photo_id: photoId,
      p_expires_in: 3600,
    });

    if (error) {
      return { url: null, error: new Error(error.message) };
    }

    return { url: data, error: null };
  } catch (err) {
    return { url: null, error: err as Error };
  }
};
