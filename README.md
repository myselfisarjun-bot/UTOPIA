# Expo App with TypeScript, Supabase, and Theme System

A fully configured Expo (React Native) application with TypeScript, ESLint, Prettier, Husky pre-commit hooks, React Navigation, Supabase authentication, and a global design system.

## Features

### 🎯 Core Setup

- **Expo** - Build iOS, Android, and web apps with React
- **TypeScript** - Full type safety across the application
- **React Navigation** - Stack and tab-based navigation structure
- **Husky & Lint-Staged** - Pre-commit hooks for code quality

### 🎨 Design System

- **Global Theme** - Light and dark mode support with semantic colors
- **Typography** - 6 heading levels, body text, labels, and captions
- **Spacing System** - Consistent spacing scale (xs: 4px to 8xl: 80px)
- **Reusable Components** - Button, Card, and Text components with theme integration

### 🔐 Authentication & Storage

- **Supabase Integration** - Complete auth setup with email/password
- **Secure Storage** - Encrypted token storage using expo-secure-store
- **Session Management** - Automatic session persistence and refresh
- **RLS Helpers** - Type-safe database query helpers with Row-Level Security support

### 🗂️ Project Structure

```
project/
├── app/                    # Expo Router screens
│   └── (tabs)/            # Tab-based navigation (Home, Explore)
├── components/            # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Text.tsx
│   └── index.ts
├── screens/               # Full-screen components
│   ├── AuthScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   └── index.ts
├── services/              # Business logic & external integrations
│   ├── auth.ts           # Authentication service
│   ├── supabase.ts       # Supabase client & helpers
│   └── secureStorage.ts  # Secure token storage
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts        # Auth state management
│   └── useTheme.ts       # Theme hooks
├── theme/                 # Design system
│   ├── colors.ts         # Light/dark color palettes
│   ├── typography.ts     # Typography scales
│   ├── spacing.ts        # Spacing scale
│   └── index.ts          # Theme factory
├── types/                 # TypeScript type definitions
│   ├── env.ts            # Environment variables
│   ├── index.ts          # Application types
├── utils/                 # Utility functions
│   └── storage.ts        # AsyncStorage helpers
└── package.json
```

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Update .env with your Supabase credentials
```

### Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can get these values from your Supabase project:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select existing one
3. Navigate to Settings → API
4. Copy the Project URL and anon key

### Running the App

```bash
# Start the development server
npm run start

# Run on iOS (macOS only)
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Development Scripts

### Linting & Formatting

```bash
# Run ESLint to check for code quality issues
npm run lint

# Fix ESLint issues automatically
npm run lint -- --fix

# Format code with Prettier
npm run format

# Check TypeScript types
npm run type-check
```

### Pre-commit Hooks

This project uses Husky and lint-staged to automatically check code before commits:

```bash
# Husky will run on git commit and check:
# - ESLint validation
# - Prettier formatting
# - TypeScript compilation
```

If pre-commit checks fail, you must fix the issues before committing.

## API Reference

### Authentication (`useAuth`)

```typescript
const { user, session, isLoading, error, signUp, signIn, signOut } = useAuth();

// Sign up
await signUp('user@example.com', 'password', 'John Doe');

// Sign in
await signIn('user@example.com', 'password');

// Sign out
await signOut();
```

### Supabase Service

```typescript
import {
  getSupabaseClient,
  queryWithRLS,
  insertWithRLS,
  updateWithRLS,
  deleteWithRLS,
} from '@/services/supabase';

// Query with RLS (read)
const { data, error } = await queryWithRLS<Post>('posts', {
  limit: 10,
  offset: 0,
  orderBy: 'created_at',
  ascending: false,
});

// Insert
const { data, error } = await insertWithRLS<Post>('posts', {
  title: 'My Post',
  content: 'Post content',
});

// Update
const { data, error } = await updateWithRLS<Post>('posts', postId, {
  title: 'Updated Title',
});

// Delete
const { error } = await deleteWithRLS('posts', postId);
```

### Secure Storage

```typescript
import {
  saveSession,
  getSession,
  saveAccessToken,
  getAccessToken,
  clearAuthData,
} from '@/services/secureStorage';

// Save session
await saveSession(session);

// Retrieve session
const session = await getSession();

// Clear all auth data
await clearAuthData();
```

### Theme System

```typescript
import { useTheme } from '@/hooks/useTheme';
import { Button, Card, Text } from '@/components';

export default function MyComponent() {
  const theme = useTheme();

  return (
    <Card>
      <Text
        variant="h4"
        color={theme.colors.primary}
      >
        Hello World
      </Text>
      <Button
        title="Click me"
        onPress={() => {}}
      />
    </Card>
  );
}
```

### Theme Colors

#### Light Mode

- **Backgrounds**: `background`, `surface`
- **Text**: `text`, `textSecondary`, `textTertiary`
- **Colors**: `primary`, `accent`, `success`, `warning`, `error`, `info`
- **States**: `disabled`, `placeholder`, `border`, `divider`

#### Dark Mode

All colors automatically adapt to dark mode when enabled.

### Typography Variants

- **Headings**: `h1` - `h6`
- **Body**: `body1`, `body2`
- **Labels**: `label`, `button`, `buttonSmall`
- **Captions**: `caption`, `small`

### Spacing Scale

```typescript
theme.spacing.xs; // 4px
theme.spacing.sm; // 8px
theme.spacing.md; // 12px
theme.spacing.lg; // 16px
theme.spacing.xl; // 20px
theme.spacing['2xl']; // 24px
theme.spacing['3xl']; // 32px
// ... up to 8xl (80px)
```

## Navigation Structure

### Auth Flow

- **AuthScreen** - Sign up / Sign in
- **OnboardingScreen** - Welcome tour
- **HomeScreen (Tabs)** - Main app interface

### Tab Navigation

- **Home Tab** - User profile and main content
- **Explore Tab** - Feature documentation

### Modal Stack

- Additional modal screens can be added to the modal route

## Customization

### Adding New Screens

```typescript
// 1. Create screen in screens/
export const MyNewScreen: React.FC = () => {
  return <View>...</View>;
};

// 2. Add route in app/
// Create app/my-screen.tsx or app/(tabs)/my-screen.tsx
```

### Extending the Theme

```typescript
// Modify theme/colors.ts to add custom colors
colors.light.myCustomColor = '#FF5733';
colors.dark.myCustomColor = '#FFB347';

// Use in components
color={theme.colors.myCustomColor}
```

### Creating New Components

```typescript
// components/MyComponent.tsx
import { useTheme } from '@/hooks/useTheme';

export const MyComponent: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      {/* Component content */}
    </View>
  );
};
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
npm run start
```

### Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading

- Ensure `.env` file is in the root directory
- Variables must start with `EXPO_PUBLIC_` to be accessible
- Restart the dev server after changes

### Supabase Connection Issues

- Verify Supabase URL and anon key in `.env`
- Check that Supabase project is running
- Ensure Row-Level Security (RLS) policies are configured

## Git Workflow

This project uses Git hooks via Husky to maintain code quality:

```bash
# Hooks run automatically:
# 1. pre-commit: Lints and formats staged files
```

To bypass hooks (not recommended):

```bash
git commit --no-verify
```

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:

1. Check the [Expo documentation](https://docs.expo.dev)
2. Review the component examples in the app
3. Check the Explore tab in the app for API reference

---

**Happy coding! 🚀**
