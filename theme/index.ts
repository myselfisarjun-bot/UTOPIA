import { colors, type ThemeMode, type ThemeColors } from './colors';
import { typography, type Typography } from './typography';
import { spacing, type Spacing } from './spacing';

export { colors, typography, spacing };
export type { ThemeMode, ThemeColors, Typography, Spacing };

export interface Theme {
  colors: ThemeColors;
  typography: Typography;
  spacing: Spacing;
  mode: ThemeMode;
}

export const createTheme = (mode: ThemeMode): Theme => ({
  colors: colors[mode],
  typography,
  spacing,
  mode,
});

// Export default light theme
export const defaultTheme = createTheme('light');
