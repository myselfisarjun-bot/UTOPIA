import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { TypographyKey } from '@/theme/typography';

interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TypographyKey;
  color?: string;
  style?: any;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body1',
  color,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();
  const typographyStyle = theme.typography[variant];
  const textColor = color || theme.colors.text;

  return (
    <RNText
      {...props}
      style={[
        {
          ...typographyStyle,
          color: textColor,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};
