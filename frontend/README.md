# Frontend Application

A modern React application built with Vite, TypeScript, and best practices for accessibility, error handling, and testing.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client with interceptors and retry logic
- **TanStack Query (React Query)** - Data fetching and caching
- **Vitest** - Unit testing
- **Testing Library** - Component testing
- **ESLint** - Code linting with accessibility rules
- **Prettier** - Code formatting

## Features

### API Client

- Axios instance with interceptors for:
  - Request ID generation and tracking
  - Automatic retries with exponential backoff
  - Timeout handling (10s default)
  - Structured logging to console
  - Error transformation to consistent format

### Core Components

1. **SearchBar** - Accessible search input with keyboard navigation
2. **ResultsList** - Keyboard-navigable results list with ARIA labels
3. **PlayerShell** - Media player interface with keyboard controls
4. **ErrorBoundary** - Catches and displays React errors
5. **ErrorBanner** - User-friendly error display with retry actions
6. **LoadingSpinner** - Accessible loading indicator
7. **LoadingSkeleton** - Skeleton screens for loading states

### Accessibility

- Full keyboard navigation support
- ARIA labels and roles throughout
- Screen reader friendly
- Focus management
- Responsive design

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
src/
├── api/              # API client and services
│   ├── client.ts     # Axios instance with interceptors
│   └── search.ts     # Search API methods
├── components/       # React components
│   ├── __tests__/    # Component tests
│   ├── ErrorBanner.tsx
│   ├── ErrorBoundary.tsx
│   ├── LoadingSkeleton.tsx
│   ├── LoadingSpinner.tsx
│   ├── PlayerShell.tsx
│   ├── ResultsList.tsx
│   ├── SearchBar.tsx
│   └── index.ts
├── hooks/            # Custom React hooks
│   ├── __tests__/    # Hook tests
│   └── useSearch.ts  # Search query hook
├── test/             # Test utilities
│   ├── mock-data.ts
│   ├── setup.ts
│   └── test-utils.tsx
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   └── logger.ts     # Structured logging
├── App.tsx           # Main application component
├── App.css           # Application styles
├── main.tsx          # Application entry point
└── index.css         # Global styles
```

## API Client

The API client is configured with:

- Base URL: `/api` (configurable via `VITE_API_BASE_URL`)
- Timeout: 10 seconds
- Max retries: 3 with exponential backoff
- Automatic request ID generation
- Request/response logging
- Error transformation

### Usage Example

```typescript
import { searchApi } from './api/search'

// Search
const results = await searchApi.search({ query: 'test', limit: 10 })

// Get by ID
const result = await searchApi.getById('123')
```

## State Management

Using TanStack Query for:
- Server state management
- Caching
- Background refetching
- Loading and error states
- Request deduplication

## Error Handling

- **ErrorBoundary**: Catches React component errors
- **ErrorBanner**: Displays API/network errors with retry option
- **Structured Errors**: All errors conform to `ApiError` interface
- **Retry Logic**: Automatic retries for network errors and 5xx responses

## Testing

Tests cover:
- Component rendering and user interactions
- Keyboard navigation
- Accessibility attributes
- Loading states
- Error states
- API mocking

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
VITE_API_BASE_URL=/api  # API base URL
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2022 support required
