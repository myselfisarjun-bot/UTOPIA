import { supabase } from './supabase';
import { Match, Message, Block, Report, User, MatchWithLastMessage } from '../types';
import { formatDistanceToNow } from 'date-fns';

export class DatabaseService {
  // Matches
  static async getMatches(): Promise<MatchWithLastMessage[]> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return [];

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        matched_user:user2_id(
          id,
          name,
          age,
          bio,
          profile_picture,
          created_at,
          updated_at
        )
      `)
      .eq('user1_id', currentUser.data.user.id)
      .order('created_at', { ascending: false });

    if (error || !matches) return [];

    // Get last message and unread count for each match
    const matchesWithMessages = await Promise.all(
      matches.map(async (match) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .eq('is_read', false)
          .neq('sender_id', currentUser.data.user!.id);

        return {
          ...match,
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        };
      })
    );

    return matchesWithMessages;
  }

  // Messages
  static async getMessages(matchId: string): Promise<Message[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error || !messages) return [];
    return messages;
  }

  static async sendMessage(matchId: string, content: string): Promise<Message | null> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return null;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUser.data.user.id,
        content: content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return message;
  }

  static async markMessagesAsRead(matchId: string): Promise<void> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', currentUser.data.user.id)
      .eq('is_read', false);
  }

  // Blocks
  static async blockUser(userId: string): Promise<boolean> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return false;

    const { error } = await supabase
      .from('blocks')
      .insert({
        blocker_id: currentUser.data.user.id,
        blocked_id: userId,
      });

    if (error) {
      console.error('Error blocking user:', error);
      return false;
    }

    return true;
  }

  static async unblockUser(userId: string): Promise<boolean> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return false;

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', currentUser.data.user.id)
      .eq('blocked_id', userId);

    if (error) {
      console.error('Error unblocking user:', error);
      return false;
    }

    return true;
  }

  static async isUserBlocked(userId: string): Promise<boolean> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return false;

    const { data, error } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', currentUser.data.user.id)
      .eq('blocked_id', userId)
      .single();

    return !error && !!data;
  }

  // Reports
  static async reportUser(userId: string, reason: string, description?: string): Promise<boolean> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return false;

    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: currentUser.data.user.id,
        reported_id: userId,
        reason,
        description,
      });

    if (error) {
      console.error('Error reporting user:', error);
      return false;
    }

    return true;
  }

  // Auth
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Profile
  static async updateProfile(updates: Partial<User>): Promise<boolean> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) return false;

    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.data.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    return true;
  }
}
