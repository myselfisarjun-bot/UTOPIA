import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatDistanceToNow } from 'date-fns';

import { MatchWithLastMessage } from '../types';
import { DatabaseService } from '../services/database';
import { RealtimeService } from '../services/realtime';
import { CacheService } from '../services/cache';

const MatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [matches, setMatches] = useState<MatchWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else if (!showRefresh) setLoading(true);

      // Try to get cached matches first for quick load
      const cachedMatches = await CacheService.getCachedMatches();
      if (cachedMatches.length > 0 && !showRefresh) {
        setMatches(cachedMatches);
      }

      // Load fresh data from database
      const freshMatches = await DatabaseService.getMatches();
      setMatches(freshMatches);
      
      // Cache the fresh data
      await CacheService.cacheMatches(freshMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', 'Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadMatches(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
      
      // Subscribe to realtime updates for matches
      const unsubscribe = RealtimeService.subscribeToMatches(() => {
        loadMatches(true);
      });

      return () => unsubscribe?.();
    }, [])
  );

  useEffect(() => {
    loadMatches();
  }, []);

  const renderMatchItem = ({ item }: { item: MatchWithLastMessage }) => {
    const truncateMessage = (message: string) => {
      if (message.length > 40) {
        return message.substring(0, 40) + '...';
      }
      return message;
    };

    const formatLastMessageTime = (createdAt: string) => {
      try {
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
      } catch {
        return '';
      }
    };

    return (
      <TouchableOpacity
        style={styles.matchItem}
        onPress={() => navigation.navigate('Chat', { match: item })}
      >
        <View style={styles.matchHeader}>
          <Image
            source={{ 
              uri: item.matched_user.profile_picture || 'https://via.placeholder.com/50'
            }}
            style={styles.profilePicture}
          />
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>{item.matched_user.name}</Text>
            {item.last_message && (
              <Text style={styles.lastMessage}>
                {truncateMessage(item.last_message.content)}
              </Text>
            )}
          </View>
          <View style={styles.matchMeta}>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
            {item.last_message && (
              <Text style={styles.lastMessageTime}>
                {formatLastMessageTime(item.last_message.created_at)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="favorite-border" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No matches yet</Text>
      <Text style={styles.emptyStateDescription}>
        Your mutual matches will appear here
      </Text>
    </View>
  );

  if (loading && matches.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Matches</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading matches...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <TouchableOpacity onPress={() => loadMatches(true)}>
          <Icon name="refresh" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={matches.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B6B"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  matchMeta: {
    alignItems: 'flex-end',
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MatchesScreen;
