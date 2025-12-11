# Project

## Frontend Application

A modern React application with Vite, TypeScript, and comprehensive testing.

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Features

✅ **Vite + React + TypeScript** - Modern build setup with strict type checking  
✅ **ESLint & Prettier** - Code quality and formatting  
✅ **Vitest + Testing Library** - Comprehensive test coverage (35 tests)  
✅ **Axios API Client** - With interceptors, retries, and logging  
✅ **TanStack Query** - Data fetching and caching  
✅ **Error Handling** - Error boundaries and user-friendly error messages  
✅ **Accessibility** - ARIA labels, keyboard navigation, screen reader support  
✅ **Responsive Design** - Mobile-friendly layouts  

### Components

- **SearchBar** - Accessible search input with keyboard navigation
- **ResultsList** - Interactive results with keyboard support
- **PlayerShell** - Media player interface
- **ErrorBoundary** - Catches React errors
- **ErrorBanner** - Displays errors with retry actions
- **LoadingSpinner** - Accessible loading indicator
- **LoadingSkeleton** - Skeleton screens

### Documentation

See [frontend/README.md](frontend/README.md) for detailed documentation.

## Project Structure

```
.
├── frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── api/      # API client and services
│   │   ├── components/ # React components
│   │   ├── hooks/    # Custom React hooks
│   │   ├── test/     # Test utilities
│   │   ├── types/    # TypeScript types
│   │   └── utils/    # Utility functions
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client
- **TanStack Query** - Server state management
- **Vitest** - Testing framework
- **ESLint** - Linting with accessibility rules
- **Prettier** - Code formatting
