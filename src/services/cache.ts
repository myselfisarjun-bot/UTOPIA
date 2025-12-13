import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, MatchWithLastMessage } from '../types';

export class CacheService {
  private static readonly MESSAGE_CACHE_PREFIX = 'messages:';
  private static readonly MATCHES_CACHE_KEY = 'matches';
  private static readonly CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

  // Message cache
  static async cacheMessages(matchId: string, messages: Message[]): Promise<void> {
    try {
      const cacheData = {
        messages,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        this.MESSAGE_CACHE_PREFIX + matchId,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error caching messages:', error);
    }
  }

  static async getCachedMessages(matchId: string): Promise<Message[]> {
    try {
      const cached = await AsyncStorage.getItem(this.MESSAGE_CACHE_PREFIX + matchId);
      if (!cached) return [];

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > this.CACHE_EXPIRY_TIME;
      
      if (isExpired) {
        await this.removeCachedMessages(matchId);
        return [];
      }

      return cacheData.messages || [];
    } catch (error) {
      console.error('Error getting cached messages:', error);
      return [];
    }
  }

  static async removeCachedMessages(matchId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.MESSAGE_CACHE_PREFIX + matchId);
    } catch (error) {
      console.error('Error removing cached messages:', error);
    }
  }

  // Matches cache
  static async cacheMatches(matches: MatchWithLastMessage[]): Promise<void> {
    try {
      const cacheData = {
        matches,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.MATCHES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }

  static async getCachedMatches(): Promise<MatchWithLastMessage[]> {
    try {
      const cached = await AsyncStorage.getItem(this.MATCHES_CACHE_KEY);
      if (!cached) return [];

      const cacheData = JSON.parse(cached);
      const isExpired = Date.now() - cacheData.timestamp > this.CACHE_EXPIRY_TIME;
      
      if (isExpired) {
        await this.removeCachedMatches();
        return [];
      }

      return cacheData.matches || [];
    } catch (error) {
      console.error('Error getting cached matches:', error);
      return [];
    }
  }

  static async removeCachedMatches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.MATCHES_CACHE_KEY);
    } catch (error) {
      console.error('Error removing cached matches:', error);
    }
  }

  // Clear all cache
  static async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(this.MESSAGE_CACHE_PREFIX) || key === this.MATCHES_CACHE_KEY
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
