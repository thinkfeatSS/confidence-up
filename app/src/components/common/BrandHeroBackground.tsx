import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { getAuthHeroGradient } from '../../theme/authBrand';

interface BrandHeroBackgroundProps {
  children: ReactNode;
  style?: ViewStyle;
}

/** Branded full-screen background for splash & onboarding (theme-aware). */
export const BrandHeroBackground = ({ children, style }: BrandHeroBackgroundProps) => {
  const { colors, isDark } = useTheme();
  const gradient = getAuthHeroGradient(isDark, colors);

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.35, y: 1 }}
      style={[styles.container, style]}>
      <View
        style={[
          styles.orbPurple,
          {
            backgroundColor: isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.12)',
          },
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.orbCyan,
          {
            backgroundColor: isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.1)',
          },
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
  orbPurple: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  orbCyan: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
});
