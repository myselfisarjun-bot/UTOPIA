export const colors = {
  // Light mode
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#E0E0E0',
    divider: '#F0F0F0',

    // Primary colors
    primary: '#007AFF',
    primaryLight: '#E3F2FD',
    primaryDark: '#0051D5',

    // Accent (muted)
    accent: '#8B7355',
    accentLight: '#E8E0D8',
    accentDark: '#6B5344',

    // Status colors
    success: '#34C759',
    successLight: '#E8F5E9',
    warning: '#FF9500',
    warningLight: '#FFF3E0',
    error: '#FF3B30',
    errorLight: '#FFEBEE',
    info: '#00C7BE',
    infoLight: '#E0F2F1',

    // Semantic colors
    disabled: '#CCCCCC',
    placeholder: '#BDBDBD',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Dark mode
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textTertiary: '#808080',
    border: '#333333',
    divider: '#2A2A2A',

    // Primary colors
    primary: '#4A9EFF',
    primaryLight: '#1D3A5C',
    primaryDark: '#0051D5',

    // Accent (muted)
    accent: '#B8956A',
    accentLight: '#4A4038',
    accentDark: '#8B7355',

    // Status colors
    success: '#66BB6A',
    successLight: '#1B5E20',
    warning: '#FFA726',
    warningLight: '#E65100',
    error: '#EF5350',
    errorLight: '#B71C1C',
    info: '#4DD0E1',
    infoLight: '#004D40',

    // Semantic colors
    disabled: '#424242',
    placeholder: '#757575',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export type ThemeMode = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
