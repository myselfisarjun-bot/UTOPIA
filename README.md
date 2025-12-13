# Chat App - Real-time Messaging with Matches

A React Native chat application with real-time messaging, matches, user blocking, reporting, and account management features.

## Features

### ✅ Matches List Screen
- Displays mutual matches with names, last message snippets, and unread message counts
- Pull-to-refresh functionality
- Optimistic loading with cached data for quick reloads
- Empty state handling when no matches exist

### ✅ Chat Screen
- Real-time messaging with Supabase Realtime subscriptions
- Optimistic message sending for better UX
- Rate limiting (5 messages per minute) with visual feedback
- Message history persistence with local caching
- Auto-scroll to latest messages
- Read receipt tracking

### ✅ Settings & Profile Management
- View and edit profile information (name, age, bio)
- Logout functionality with confirmation
- Block user functionality with safety confirmations
- Report user functionality with custom reasons
- Account settings and preferences

### ✅ Security & UX Features
- Confirmation dialogs for destructive actions (logout, block, report)
- Blocked users are filtered from matches and chat
- Rate limiting prevents message spam
- Proper error handling and user feedback
- Clean, intuitive interface with Material Design icons

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (Database, Auth, Realtime)
- **Navigation**: React Navigation v6
- **Local Storage**: AsyncStorage for caching
- **UI Components**: Custom components with React Native elements
- **Icons**: Material Design Icons

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/             # Screen components
│   ├── MatchesScreen.tsx    # Matches list
│   ├── ChatScreen.tsx       # Real-time chat
│   └── SettingsScreen.tsx   # Settings & profile
├── services/            # Business logic & API
│   ├── supabase.ts          # Supabase client
│   ├── database.ts          # Database operations
│   ├── realtime.ts          # Real-time subscriptions
│   └── cache.ts             # Local caching
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the SQL schema from `supabase-schema.sql`
3. Run the SQL in your Supabase SQL Editor
4. Get your project's URL and anon key from Settings > API

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 4. Installation & Running

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

## Database Schema

The application uses the following main tables:

- **users**: User profiles and metadata
- **matches**: Mutual matches between users
- **messages**: Chat messages with read receipts
- **blocks**: User blocking relationships
- **reports**: User reports for safety

### Key Features:
- Row Level Security (RLS) enabled
- Realtime subscriptions for messages and matches
- Automatic user profile creation
- Proper indexing for performance

## API Usage

### DatabaseService
```typescript
// Get matches with last message
const matches = await DatabaseService.getMatches();

// Send a message
const message = await DatabaseService.sendMessage(matchId, content);

// Block a user
const success = await DatabaseService.blockUser(userId);

// Report a user
const success = await DatabaseService.reportUser(userId, reason, description);

// Update profile
const success = await DatabaseService.updateProfile({ name, age, bio });
```

### RealtimeService
```typescript
// Subscribe to new messages
const unsubscribe = RealtimeService.subscribeToMessages(matchId, (message) => {
  // Handle new message
});

// Check rate limiting
const rateLimit = RealtimeService.checkRateLimit();
```

### CacheService
```typescript
// Cache messages for offline support
await CacheService.cacheMessages(matchId, messages);

// Retrieve cached messages
const cached = await CacheService.getCachedMessages(matchId);
```

## Security Considerations

### Row Level Security (RLS)
- Users can only access their own data
- Matches are only visible to participants
- Messages restricted to match participants
- Blocks and reports are user-private

### Rate Limiting
- 5 messages per minute per user
- Visual feedback when limit exceeded
- Countdown timer for restriction

### User Safety
- Confirmation dialogs for destructive actions
- Blocked users removed from matches and chat
- Report system with multiple reason categories
- Proper error handling without sensitive data exposure

## Development Notes

### Real-time Features
- Supabase Realtime for live message updates
- Automatic reconnection handling
- Optimistic updates for immediate feedback

### Caching Strategy
- Messages cached for 5 minutes
- Matches cached with automatic refresh
- Offline support for recent conversations

### Error Handling
- Network error recovery
- User-friendly error messages
- Graceful degradation for missing features

## Testing

To test the application:

1. Create multiple user accounts
2. Create matches between users
3. Test real-time messaging
4. Verify rate limiting works
5. Test block/report functionality
6. Check profile editing
7. Test logout/login flow

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Add proper error handling
4. Include security considerations
5. Test on multiple platforms

## License

This project is for educational purposes. Please ensure proper licensing for production use.
