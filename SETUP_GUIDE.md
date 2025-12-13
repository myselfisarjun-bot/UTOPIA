# Project Setup Guide

## What Was Initialized

This is a complete Expo (React Native) application with TypeScript, Supabase integration, and a global design system. Here's what has been set up:

### ✅ Core Setup

- **Expo 54** with React Navigation
- **TypeScript** with strict type checking
- **ESLint & Prettier** for code quality
- **Husky pre-commit hooks** with lint-staged

### ✅ Project Structure

```
project/
├── app/                     # Expo Router navigation
│   ├── _layout.tsx         # Root layout
│   ├── modal.tsx           # Modal screen
│   └── (tabs)/             # Tab navigation
│       ├── _layout.tsx     # Tab layout
│       ├── index.tsx       # Home screen
│       └── explore.tsx     # Features screen
│
├── components/             # Reusable UI components
│   ├── Button.tsx          # Customizable button
│   ├── Card.tsx            # Card container
│   ├── Text.tsx            # Theme-aware text
│   └── index.ts            # Barrel export
│
├── screens/                # Full-screen components
│   ├── AuthScreen.tsx      # Sign up/Sign in
│   ├── OnboardingScreen.tsx # Onboarding flow
│   ├── HomeScreen.tsx      # Main content
│   └── index.ts            # Barrel export
│
├── services/               # Business logic
│   ├── auth.ts            # Auth service
│   ├── supabase.ts        # Supabase client
│   ├── secureStorage.ts   # Secure token storage
│   └── index.ts           # Barrel export
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Auth state
│   ├── useTheme.ts        # Theme hook
│   └── index.ts           # Barrel export
│
├── theme/                  # Design system
│   ├── colors.ts          # Color palettes
│   ├── typography.ts      # Typography scales
│   ├── spacing.ts         # Spacing system
│   └── index.ts           # Theme factory
│
├── types/                  # TypeScript types
│   ├── env.ts             # Environment types
│   └── index.ts           # App types
│
├── utils/                  # Utilities
│   ├── storage.ts         # AsyncStorage helpers
│   └── index.ts           # Barrel export
│
├── .env.example           # Environment template
├── .prettierrc             # Prettier config
├── .prettierignore         # Prettier ignore
├── .lintstagedrc.json      # Lint-staged config
├── .husky/                 # Git hooks
│   └── pre-commit          # Pre-commit hook
├── tsconfig.json           # TypeScript config
├── app.json                # Expo config
├── package.json            # Dependencies
└── README.md               # Main documentation
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env with your Supabase credentials
# Get these from: https://supabase.com
```

### 3. Start Development

```bash
npm run start

# Or specific platform:
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## Key Features Implemented

### 🎨 Design System

- **Colors**: Light/dark modes with semantic colors (primary, accent, success, warning, error)
- **Typography**: 6 heading sizes, body text, labels, captions with consistent sizing
- **Spacing**: Consistent scale from xs (4px) to 8xl (80px)
- **Components**: Button (4 variants), Card, and Text with full theme integration

### 🔐 Authentication

- **Supabase Auth**: Email/password sign up and sign in
- **Session Management**: Automatic session persistence
- **Secure Storage**: Encrypted token storage with expo-secure-store
- **Password Reset**: Reset and update password functionality
- **Error Handling**: Type-safe error responses

### 📦 Supabase Integration

- **RLS Helpers**: Type-safe queryWithRLS, insertWithRLS, updateWithRLS, deleteWithRLS
- **Client Management**: Lazy initialization with getSupabaseClient
- **Error Handling**: Consistent error patterns across all operations
- **Type Safety**: Full TypeScript support with generic types

### 🧭 Navigation

- **Stack Navigation**: Auth → Onboarding → App
- **Tab Navigation**: Home and Explore tabs
- **Modal Support**: Ready for modal screens
- **Loading States**: Loading indicator during auth restoration

### 🛠️ Development Tools

- **ESLint**: Code quality checking
- **Prettier**: Automatic code formatting
- **TypeScript**: Full type safety
- **Husky**: Pre-commit hooks
- **Lint-staged**: Check only changed files

## npm Scripts

### Development

- `npm run start` - Start Expo dev server
- `npm run ios` - Run on iOS
- `npm run android` - Run on Android
- `npm run web` - Run on web

### Code Quality

- `npm run lint` - Check for issues
- `npm run lint -- --fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

### Other

- `npm run reset-project` - Reset to fresh app (if available)

## Configuration Files

### `.env.example`

Template for environment variables. Copy to `.env` and fill with:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### `tsconfig.json`

- Strict mode enabled
- Path aliases configured for easy imports (@/screens, @/components, etc.)
- JSON module resolution enabled

### `.prettierrc`

- 100 character line width
- 2 space tabs
- Single quotes
- Trailing commas in ES5

### `eslint.config.js`

- Based on expo config
- TypeScript support
- Strict checking

### `.lintstagedrc.json`

- Runs ESLint and Prettier on staged files
- Runs on TS/TSX and JSON/MD files

## Extending the Project

### Adding a New Screen

1. Create component in `screens/`
2. Export from `screens/index.ts`
3. Add route to `app/` using Expo Router

### Adding a New Service

1. Create service in `services/`
2. Export from `services/index.ts`
3. Use in components via hooks

### Customizing Theme

Edit `theme/colors.ts` for colors, `theme/typography.ts` for fonts, or `theme/spacing.ts` for spacing.

### Adding Types

Add to `types/index.ts` or create new file in `types/` folder.

## Troubleshooting

### Port Already in Use

```bash
lsof -ti:8081 | xargs kill -9
npm run start
```

### Environment Variables Not Loading

- Ensure `.env` is in root directory
- Variables must start with `EXPO_PUBLIC_`
- Restart dev server after changes

### Supabase Connection Issues

- Verify credentials in `.env`
- Check Supabase project is active
- Ensure RLS policies are configured

### TypeScript Errors

```bash
npm run type-check
```

### Linting Errors

```bash
npm run lint -- --fix
```

## Next Steps

1. **Configure Supabase**
   - Create tables for your app
   - Set up Row-Level Security (RLS) policies
   - Configure authentication settings

2. **Customize Theme**
   - Adjust colors in `theme/colors.ts`
   - Modify typography if needed
   - Add custom spacing if required

3. **Add Features**
   - Create new screens in `screens/`
   - Add services for business logic
   - Create reusable components

4. **Deploy**
   - Build for iOS: `expo build --platform ios`
   - Build for Android: `expo build --platform android`
   - Deploy web: `npm run web`

## Resources

- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Support

Refer to `README.md` for detailed API documentation and component usage examples.

---

**Project initialized successfully! 🚀**
