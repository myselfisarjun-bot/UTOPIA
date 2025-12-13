import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export class RealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static messageRateLimit = 5; // Max 5 messages per minute
  private static rateLimitWindow = 60 * 1000; // 1 minute in milliseconds
  private static messageTimestamps: number[] = [];

  static subscribeToMessages(matchId: string, onMessage: (message: any) => void) {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onMessage(payload.new);
        }
      )
      .subscribe();

    this.channels.set(matchId, channel);
    return () => this.unsubscribeFromMessages(matchId);
  }

  static unsubscribeFromMessages(matchId: string) {
    const channel = this.channels.get(matchId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(matchId);
    }
  }

  static subscribeToMatches(onMatchUpdate: () => void) {
    const currentUser = supabase.auth.getUser();
    currentUser.then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel(`matches:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `user1_id=eq.${user.id}`,
          },
          onMatchUpdate
        )
        .subscribe();

      this.channels.set(`matches:${user.id}`, channel);
    });
  }

  static checkRateLimit(): { isLimited: boolean; remainingTime: number } {
    const now = Date.now();
    // Remove timestamps outside the rate limit window
    this.messageTimestamps = this.messageTimestamps.filter(
      timestamp => now - timestamp < this.rateLimitWindow
    );

    if (this.messageTimestamps.length >= this.messageRateLimit) {
      const oldestTimestamp = this.messageTimestamps[0];
      const remainingTime = this.rateLimitWindow - (now - oldestTimestamp);
      return {
        isLimited: true,
        remainingTime: Math.ceil(remainingTime / 1000),
      };
    }

    return { isLimited: false, remainingTime: 0 };
  }

  static recordMessage() {
    this.messageTimestamps.push(Date.now());
  }

  static resetRateLimit() {
    this.messageTimestamps = [];
  }

  static cleanup() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}
