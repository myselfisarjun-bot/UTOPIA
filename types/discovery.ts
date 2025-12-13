export interface DiscoveryCandidate {
  profile_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  distance_km: number | null;
  match_score: number;
  primary_photo_signed_url: string | null;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  birthdate: string | null;
  gender: 'female' | 'male' | 'nonbinary' | 'other' | 'prefer_not_to_say' | null;
  is_discoverable: boolean;
  last_active_at: string;
  created_at: string;
}

export interface ProfilePhoto {
  id: string;
  user_id: string;
  bucket_id: string;
  storage_path: string;
  is_primary: boolean;
  is_public: boolean;
  created_at: string;
}

export interface UserInterest {
  user_id: string;
  interest_id: number;
  interest_name?: string;
}

export interface Interest {
  id: number;
  name: string;
}

export interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user1: string;
  user2: string;
  status: 'active' | 'blocked';
  created_at: string;
  last_message_at: string | null;
}

export interface LikeResult {
  is_match: boolean;
  match_id?: string;
  likes_remaining: number;
}
