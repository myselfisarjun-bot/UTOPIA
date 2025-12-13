import { useColorScheme } from 'react-native';
import { createTheme, type Theme, type ThemeMode } from '@/theme';

export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  const mode = (colorScheme === 'dark' ? 'dark' : 'light') as ThemeMode;

  return createTheme(mode);
};

export const useThemeMode = (): ThemeMode => {
  const colorScheme = useColorScheme();
  return (colorScheme === 'dark' ? 'dark' : 'light') as ThemeMode;
};
