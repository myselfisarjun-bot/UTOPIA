# Discovery Screen Documentation

## Overview

The Discovery Screen is the core feature of the dating app MVP that allows users to browse and like potential matches. This implementation follows the card-based "swipe" pattern common in modern dating apps.

## Features

### 1. Card-Based Profile Display

- Shows one profile at a time in a large, photo-focused card
- Displays:
  - Primary photo (full screen, signed URL from Supabase Storage)
  - Name and age (calculated from birthdate)
  - Bio (truncated to 3 lines)
  - Distance (if location data is available)

### 2. Like/Pass Actions

- **Like Button**: Green button that records a like via Supabase
  - Calls `likeProfile()` RPC
  - Checks daily like limit (50 by default)
  - Creates match automatically on mutual like via database trigger
  - Shows match confirmation modal if mutual like detected
- **Pass Button**: Red button to skip to next profile
  - No database action (just UI navigation)

### 3. Daily Like Limit

- Displays remaining likes in header (e.g., "5/50 likes remaining")
- Enforced via Supabase RLS policies and triggers
- Updates after each like action
- Shows error if limit exceeded

### 4. Match Confirmation Modal

- Appears automatically when mutual like detected
- Shows matched profile information
- Options:
  - "Send Message" → Navigate to chat
  - "Keep Swiping" → Continue discovering

### 5. Profile Detail Modal

- Tap on profile card to view full details
- Features:
  - Photo carousel (horizontal scroll through all photos)
  - Complete bio text
  - List of shared interests
  - Last active timestamp
  - Block and Report buttons

### 6. Profile Completeness Guard

- Prevents access to discovery if profile incomplete
- Uses `profile_completeness_score` RPC from database
- Requires minimum 70% completion score
- Shows helpful message with requirements:
  - Profile photo
  - Bio and interests
  - Age and location

### 7. Candidate Fetching

- Fetches 10 candidates at a time via `get_discovery_candidates` RPC
- Auto-loads next batch when nearing end (3 cards remaining)
- Filters out:
  - Already liked profiles
  - Already matched profiles
  - Profiles outside max distance (100km default)
  - Non-discoverable profiles
- Orders by match_score (deterministic algorithm)

## Technical Implementation

### Components

#### `DiscoveryScreen.tsx`

Main screen component with:

- State management for candidates, current index, likes remaining
- Like/pass action handlers
- Modal management (match, profile details)
- Photo signed URL fetching

#### `DiscoveryScreenGuard.tsx`

Wrapper component that:

- Checks profile completeness before allowing access
- Shows loading state while checking
- Displays helpful message if profile incomplete
- Redirects to onboarding if needed

### Services

#### `services/discovery.ts`

API layer with functions:

- `getDiscoveryCandidates()` - Fetch candidate list
- `likeProfile()` - Record like and check for match
- `passProfile()` - Skip profile (no-op)
- `getDailyLikesRemaining()` - Get like count
- `getProfileDetails()` - Fetch full profile data
- `blockUser()` - Block a user
- `reportUser()` - Report a user
- `getPhotoSignedUrl()` - Get signed URL for photo

### Hooks

#### `useProfileCompleteness.ts`

React hook that:

- Checks if user profile is complete
- Calls `profile_completeness_score` RPC
- Returns `isComplete`, `isLoading`, `error`, `score`

### Types

#### `types/discovery.ts`

TypeScript interfaces for:

- `DiscoveryCandidate` - Candidate profile data
- `Profile` - Full profile data
- `ProfilePhoto` - Photo metadata
- `UserInterest` - User interest data
- `Like`, `Match` - Database entities
- `LikeResult` - Result from like action

## Database Integration

### RPCs Used

- `get_discovery_candidates` - Fetch ranked candidates
- `profile_completeness_score` - Check profile completion
- `can_like` - Check if user can like (daily limit)
- `daily_like_limit` - Get daily limit value
- `mint_photo_signed_url` - Get signed URL for photos

### Tables Used

- `profiles` - User profile data
- `photos` - Photo metadata
- `likes` - Like records
- `matches` - Match records (created automatically)
- `user_interests` - User interests
- `interests` - Interest catalog

### RLS Policies

All database operations respect Row Level Security:

- Users can only like discoverable profiles
- Like limit enforced via trigger
- Matches created automatically on mutual like
- Photos protected by RLS and signed URLs

## Navigation

### Tab Integration

Added "Discover" tab to bottom navigation:

- Located in `app/(tabs)/discover.tsx`
- Uses `DiscoveryScreenGuard` wrapper
- Header hidden for immersive experience

### Navigation Callbacks

- `onNavigateToChat` - Called on match, navigate to chat
- `onNavigateToOnboarding` - Called if profile incomplete

## Error Handling

- Network errors show error message with retry button
- Daily limit errors show user-friendly message
- Profile fetch errors logged and skipped
- Block/report actions show confirmation alerts

## UI/UX Details

### Design System

- Uses theme colors (black/white + accent)
- Inline styles with theme-aware colors
- Simple button styling (no fancy animations)
- Modal overlays for match and profile details

### Accessibility

- Touchable areas for card and buttons
- Loading indicators during async actions
- Error messages with clear instructions
- Alert dialogs for destructive actions

## Future Enhancements

Potential improvements not in MVP:

- Swipe gestures (left/right)
- Photo zoom and pan
- Undo last action
- Advanced filters (age, distance, interests)
- Super likes
- Profile boost
- Match expiration
- Read receipts for photos viewed

## Usage Example

```typescript
import { DiscoveryScreenGuard } from '@/screens';

function MyApp() {
  return (
    <DiscoveryScreenGuard
      onNavigateToChat={() => router.push('/chat')}
      onNavigateToOnboarding={() => router.push('/onboarding')}
    />
  );
}
```

## Testing Checklist

- [ ] Profile guard prevents incomplete profiles
- [ ] Candidates load and display correctly
- [ ] Like button records like in database
- [ ] Daily limit enforced and displayed
- [ ] Match modal appears on mutual like
- [ ] Profile detail modal shows full info
- [ ] Block/report actions work
- [ ] Navigation to chat works
- [ ] Error handling shows appropriate messages
- [ ] Photo signed URLs load correctly
