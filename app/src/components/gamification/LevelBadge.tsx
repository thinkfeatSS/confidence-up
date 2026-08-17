import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getLevelColor } from '../../data/mockUser';

interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export const LevelBadge = ({ level, title, size = 'md', showTitle = false }: LevelBadgeProps) => {
  const { colors } = useTheme();
  const color = getLevelColor(level);
  const dimensions = size === 'sm' ? 28 : size === 'md' ? 36 : 52;
  const fontSize = size === 'sm' ? 11 : size === 'md' ? 14 : 20;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[color, `${color}99`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: dimensions,
            height: dimensions,
            borderRadius: dimensions / 2,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}>
        <Text style={[styles.levelText, { fontSize, color: colors.white }]}>{level}</Text>
      </LinearGradient>
      {showTitle && title && (
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>{title}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  levelText: {
    fontWeight: '800',
  },
  title: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 80,
    textAlign: 'center',
  },
});
