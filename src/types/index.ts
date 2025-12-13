export interface User {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  matched_user: User;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description?: string;
  created_at: string;
}

export interface MatchWithLastMessage extends Match {
  last_message?: Message;
  unread_count: number;
}

export interface RateLimitState {
  isLimited: boolean;
  remainingTime: number;
  nextAllowedTime: number;
}

export interface ChatScreenProps {
  route: {
    params: {
      match: Match;
    };
  };
  navigation: any;
}

export interface MatchesScreenProps {
  navigation: any;
}

export interface SettingsScreenProps {
  navigation: any;
}

export type RootStackParamList = {
  Matches: undefined;
  Chat: { match: Match };
  Settings: undefined;
};
