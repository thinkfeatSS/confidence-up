import React, { ReactNode, useMemo } from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  padding?: number;
  noPadding?: boolean;
}

const _GlassCard = ({ children, style, glowColor, padding = 20, noPadding = false }: GlassCardProps) => {
  const { colors } = useTheme();
  const glowStyle = useMemo(
    () =>
      glowColor
        ? {
            borderColor: glowColor,
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 } as const,
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 2,
          }
        : null,
    [glowColor],
  );
  const paddingStyle = useMemo(
    () => (noPadding ? null : { padding }),
    [noPadding, padding],
  );
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        paddingStyle,
        glowStyle,
        style,
      ]}>
      {children}
    </View>
  );
};
export const GlassCard = React.memo(_GlassCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
