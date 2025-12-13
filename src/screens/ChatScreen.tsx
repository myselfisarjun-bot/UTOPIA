import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format, isToday, isYesterday } from 'date-fns';

import { ChatScreenProps, Message } from '../types';
import { DatabaseService } from '../services/database';
import { RealtimeService } from '../services/realtime';
import { CacheService } from '../services/cache';

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { match } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rateLimitState, setRateLimitState] = useState({
    isLimited: false,
    remainingTime: 0,
  });
  
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadMessages = async () => {
    try {
      setLoading(true);

      // Try to get cached messages first for quick load
      const cachedMessages = await CacheService.getCachedMessages(match.id);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
      }

      // Load fresh messages from database
      const freshMessages = await DatabaseService.getMessages(match.id);
      setMessages(freshMessages);
      
      // Cache the fresh messages
      await CacheService.cacheMessages(match.id, freshMessages);

      // Mark messages as read
      await DatabaseService.markMessagesAsRead(match.id);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // Check rate limit
    const rateLimit = RealtimeService.checkRateLimit();
    if (rateLimit.isLimited) {
      setRateLimitState({
        isLimited: true,
        remainingTime: rateLimit.remainingTime,
      });
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      match_id: match.id,
      sender_id: 'current-user', // This should be the actual user ID
      content: messageText,
      created_at: new Date().toISOString(),
      is_read: true,
    };

    // Add optimistic message to the list
    setMessages(prev => [...prev, optimisticMessage]);
    flatListRef.current?.scrollToEnd();

    try {
      // Record the message for rate limiting
      RealtimeService.recordMessage();

      // Send message to database
      const sentMessage = await DatabaseService.sendMessage(match.id, messageText);
      
      if (!sentMessage) {
        throw new Error('Failed to send message');
      }

      // Replace optimistic message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage : msg
        )
      );

      // Update cache
      const updatedMessages = messages.map(msg => 
        msg.id === optimisticMessage.id ? sentMessage : msg
      );
      await CacheService.cacheMessages(match.id, updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageText); // Restore the text
    } finally {
      setSending(false);
      checkRateLimit();
    }
  };

  const checkRateLimit = () => {
    const rateLimit = RealtimeService.checkRateLimit();
    setRateLimitState(rateLimit);
    
    if (rateLimit.isLimited) {
      // Countdown timer
      const timer = setInterval(() => {
        setRateLimitState(prev => {
          const newRemainingTime = Math.max(0, prev.remainingTime - 1);
          if (newRemainingTime === 0) {
            clearInterval(timer);
            return { isLimited: false, remainingTime: 0 };
          }
          return { ...prev, remainingTime: newRemainingTime };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMessages();

      // Subscribe to realtime messages
      unsubscribeRef.current = RealtimeService.subscribeToMessages(match.id, (newMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(msg => msg.id === newMessage.id)) {
            return prev;
          }
          
          const updatedMessages = [...prev, newMessage];
          // Update cache with new message
          CacheService.cacheMessages(match.id, updatedMessages);
          return updatedMessages;
        });
        
        flatListRef.current?.scrollToEnd();
      });

      return () => {
        unsubscribeRef.current?.();
      };
    }, [match.id])
  );

  useEffect(() => {
    checkRateLimit();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: match.matched_user.name,
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => {
            // Handle user profile/action
            Alert.alert('User Actions', 'Block or Report options would go here');
          }}
        >
          <Icon name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, match]);

  const formatMessageTime = (createdAt: string) => {
    try {
      const date = new Date(createdAt);
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM d');
      }
    } catch {
      return '';
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.sender_id === 'current-user'; // Replace with actual user ID check
    const showTime = index === messages.length - 1 || 
      formatMessageTime(item.created_at) !== formatMessageTime(messages[index - 1]?.created_at);

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.content}
          </Text>
        </View>
        {showTime && (
          <Text style={styles.messageTime}>
            {formatMessageTime(item.created_at)}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>Start the conversation!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />

      {rateLimitState.isLimited && (
        <View style={styles.rateLimitOverlay}>
          <Text style={styles.rateLimitText}>
            Rate limit reached. Try again in {rateLimitState.remainingTime}s
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            editable={!rateLimitState.isLimited}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending || rateLimitState.isLimited) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending || rateLimitState.isLimited}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon 
                name="send" 
                size={24} 
                color={(!newMessage.trim() || sending || rateLimitState.isLimited) ? '#ccc' : '#fff'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  currentUserBubble: {
    backgroundColor: '#FF6B6B',
  },
  otherUserBubble: {
    backgroundColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  rateLimitOverlay: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffcdd2',
  },
  rateLimitText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatScreen;
