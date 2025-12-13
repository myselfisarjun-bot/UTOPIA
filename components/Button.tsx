import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      flexDirection: 'row',
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? theme.colors.disabled : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.disabled : theme.colors.accent,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? theme.colors.disabled : theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
      },
      medium: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
      },
      large: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
      },
    };

    return {
      ...baseStyle,
      ...(variantStyles[variant] || variantStyles.primary),
      ...(sizeStyles[size] || sizeStyles.medium),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...theme.typography.button,
      marginHorizontal: loading ? theme.spacing.sm : 0,
    };

    const variantTextStyles: Record<string, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      outline: {
        color: disabled ? theme.colors.disabled : theme.colors.primary,
      },
      ghost: {
        color: disabled ? theme.colors.disabled : theme.colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...(variantTextStyles[variant] || variantTextStyles.primary),
    };
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style, { opacity: disabled ? 0.6 : 1 }]}
      activeOpacity={0.7}
    >
      {loading && <ActivityIndicator color={getTextStyle().color} size="small" />}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};
