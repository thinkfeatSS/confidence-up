import React, { ReactNode, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface GradientBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'purple' | 'dark';
}

export const GradientBackground = ({ children, style, variant = 'default' }: GradientBackgroundProps) => {
  const { colors, isDark } = useTheme();

  const gradients = useMemo(() => {
    if (!isDark) {
      return {
        default: ['#F8FAFC', '#EEF2FF', '#F8FAFC'],
        purple: ['#F5F3FF', '#EDE9FE', '#F8FAFC'],
        dark: [colors.bgSecondary, colors.bgPrimary, colors.bgSecondary],
      };
    }
    return {
      default: [colors.bgPrimary, '#0D0E1F', colors.bgPrimary],
      purple: ['#0A0B14', '#130A2A', '#0A0B14'],
      dark: [colors.bgSecondary, colors.bgPrimary, colors.bgSecondary],
    };
  }, [colors.bgPrimary, colors.bgSecondary, isDark]);

  return (
    <LinearGradient
      colors={gradients[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, style]}>
      <View
        style={[
          styles.glowTop,
          { backgroundColor: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.08)' },
        ]}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
