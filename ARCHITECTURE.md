# Frontend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / User                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   React Application                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              App.tsx (Main Component)                 │   │
│  │  - ErrorBoundary wrapper                             │   │
│  │  - QueryClientProvider (React Query)                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         UI Components Layer                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ SearchBar   │  │ ResultsList │  │ PlayerShell │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ ErrorBanner │  │ LoadingSpnr │  │ Skeleton    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         Hooks Layer (State Management)                │   │
│  │  ┌──────────────────────────────────────────┐        │   │
│  │  │  useSearch (React Query hook)            │        │   │
│  │  │  - Fetches search results                │        │   │
│  │  │  - Manages loading/error states          │        │   │
│  │  │  - Caches responses                      │        │   │
│  │  └──────────────────────────────────────────┘        │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │         API Layer (HTTP Client)                       │   │
│  │  ┌──────────────────────────────────────────┐        │   │
│  │  │  Axios Client (client.ts)                │        │   │
│  │  │  ┌────────────────────────────────────┐  │        │   │
│  │  │  │  Request Interceptor               │  │        │   │
│  │  │  │  - Add Request ID                  │  │        │   │
│  │  │  │  - Add timestamp                   │  │        │   │
│  │  │  │  - Log request                     │  │        │   │
│  │  │  └────────────────────────────────────┘  │        │   │
│  │  │  ┌────────────────────────────────────┐  │        │   │
│  │  │  │  Response Interceptor              │  │        │   │
│  │  │  │  - Log response                    │  │        │   │
│  │  │  │  - Calculate duration              │  │        │   │
│  │  │  │  - Transform errors                │  │        │   │
│  │  │  └────────────────────────────────────┘  │        │   │
│  │  │  ┌────────────────────────────────────┐  │        │   │
│  │  │  │  Retry Logic (axios-retry)         │  │        │   │
│  │  │  │  - Max 3 retries                   │  │        │   │
│  │  │  │  - Exponential backoff             │  │        │   │
│  │  │  │  - Retry on 5xx or network error   │  │        │   │
│  │  │  └────────────────────────────────────┘  │        │   │
│  │  └──────────────────────────────────────────┘        │   │
│  │  ┌──────────────────────────────────────────┐        │   │
│  │  │  API Services (search.ts)                │        │   │
│  │  │  - search(params)                        │        │   │
│  │  │  - getById(id)                           │        │   │
│  │  └──────────────────────────────────────────┘        │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ HTTP Request with headers:
                          │ - X-Request-ID: req_123_abc
                          │ - Content-Type: application/json
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Backend API                               │
│                  (To be implemented)                         │
│  - GET /search?query=<term>&limit=<num>                     │
│  - GET /search/:id                                           │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Search Request Flow

```
User Input
    │
    ▼
SearchBar Component
    │
    │ onSearch(query)
    ▼
App State (setSearchQuery)
    │
    │ triggers
    ▼
useSearch Hook
    │
    │ React Query
    ▼
searchApi.search(params)
    │
    │ axios
    ▼
Request Interceptor
    │
    │ add request ID, log
    ▼
HTTP Request → Backend
    │
    │ response
    ▼
Response Interceptor
    │
    │ log, transform errors
    ▼
React Query Cache
    │
    │ update state
    ▼
useSearch returns data
    │
    ▼
ResultsList Component
    │
    ▼
UI Update
```

### 2. Error Flow

```
Network Error / 5xx Response
    │
    ▼
axios-retry
    │
    ├─ Retry 1 (exponential delay)
    ├─ Retry 2 (exponential delay)
    └─ Retry 3 (exponential delay)
    │
    │ all retries failed
    ▼
Response Interceptor
    │
    │ transform to ApiError
    ▼
React Query Error State
    │
    ▼
useSearch returns error
    │
    ▼
ErrorBanner Component
    │
    │ user clicks retry
    ▼
refetch() → repeat flow
```

### 3. Component Error Flow

```
React Component Error
    │
    ▼
ErrorBoundary.componentDidCatch()
    │
    ├─ Log error
    └─ Update state
    │
    ▼
Display fallback UI
    │
    │ user clicks retry
    ▼
Reset error state
    │
    ▼
Re-render component
```

## Component Hierarchy

```
App
├── ErrorBoundary
│   └── QueryClientProvider
│       └── AppContent
│           ├── Header
│           ├── SearchBar
│           ├── ErrorBanner (conditional)
│           ├── Results Section
│           │   ├── LoadingSpinner (when loading)
│           │   └── ResultsList
│           │       └── ResultItem (button)
│           │           ├── Title
│           │           ├── Description
│           │           └── Link (optional)
│           └── PlayerShell (conditional)
│               ├── Media Info
│               ├── Play/Pause Button
│               └── Close Button
```

## State Management Strategy

### Local State (useState)
- `searchQuery` - Current search query
- `selectedItem` - Currently selected result for player
- Component-specific UI state

### Server State (React Query)
- Search results
- Cached responses
- Loading states
- Error states
- Background refetching

### Error State
- Network errors → React Query error state → ErrorBanner
- Component errors → ErrorBoundary → Fallback UI

## Key Design Patterns

### 1. Separation of Concerns
```
UI Components → Pure presentation
Hooks → Business logic & state
API Layer → HTTP communication
Utils → Shared utilities
```

### 2. Error Boundaries
```
ErrorBoundary (top level)
    └── Catches all React errors
    └── Prevents white screen
    └── Provides recovery
```

### 3. Request/Response Lifecycle

**Request:**
```typescript
1. Generate request ID
2. Add to headers (X-Request-ID)
3. Log request start
4. Set timeout (10s)
5. Send request
```

**Response:**
```typescript
1. Calculate duration
2. Log response
3. Return data
```

**Error:**
```typescript
1. Log error with request ID
2. Check if retryable
3. Retry with exponential backoff (if applicable)
4. Transform to ApiError
5. Propagate to React Query
```

## TypeScript Type System

```
types/index.ts
├── SearchResult        (API response shape)
├── PlayerData          (Player state)
├── ApiError            (Standardized error)
└── LoadingState        (Loading tracking)

API Types
├── SearchParams        (search.ts)
└── AxiosInstance types (from axios)

Component Props
└── Each component defines its own props interface
```

## Accessibility Architecture

### ARIA Hierarchy
```
Application
├── [role="search"] Search Form
│   ├── [aria-label] Search input
│   └── [aria-label] Search button
├── [role="alert"] Error Banner
│   └── [aria-live="assertive"]
├── [role="status"] Loading Spinner
│   └── [aria-live="polite"]
├── [role="list"] Results List
│   └── [role="button"] Each result (keyboard accessible)
└── [role="region"] Player Shell
    ├── [aria-label="Media player"]
    └── [aria-pressed] Play button state
```

### Keyboard Navigation Map
```
Tab       → Next focusable element
Shift+Tab → Previous focusable element
Enter     → Activate button/submit form
Space     → Activate button (on player)
Escape    → Close player
```

## Testing Strategy

```
Component Tests
├── Rendering
├── User interactions
├── Keyboard navigation
├── Accessibility attributes
├── Error states
└── Loading states

Hook Tests
├── Data fetching
├── Error handling
├── State updates
└── Cache behavior

Integration
└── All pieces work together
```

## Configuration Files

```
vite.config.ts
└── Build configuration

vitest.config.ts
└── Test configuration

tsconfig.json
├── tsconfig.app.json    (app code)
└── tsconfig.node.json   (build scripts)

eslint.config.js
└── Linting rules

.prettierrc
└── Formatting rules
```

## Performance Optimizations

1. **React Query Caching**
   - Search: 5 min cache
   - By ID: 10 min cache
   - Background refetch

2. **Vite Code Splitting**
   - Automatic chunking
   - Tree shaking
   - Minification

3. **Lazy Loading**
   - Components load on demand
   - Async imports possible

4. **Request Deduplication**
   - React Query prevents duplicate requests
   - Automatic retry on failure

## Security Considerations

1. **Type Safety**
   - TypeScript prevents runtime errors
   - Strict mode enabled

2. **Error Handling**
   - No sensitive info in error messages
   - Structured logging

3. **External Links**
   - `rel="noopener noreferrer"`
   - Prevents tabnabbing

4. **Input Validation**
   - Query trimming
   - Empty query prevention

## Scalability

The architecture supports:
- ✅ Adding new API endpoints
- ✅ Additional UI components
- ✅ More complex state management
- ✅ Multiple API clients
- ✅ Feature flags
- ✅ A/B testing
- ✅ Monitoring integration
- ✅ Analytics tracking

## Future Enhancements

Easy to add:
- Authentication/Authorization
- WebSocket support
- Offline mode (service workers)
- Progressive Web App (PWA)
- Internationalization (i18n)
- Theme switching
- Advanced filtering
- Pagination
- Infinite scroll
- File uploads
