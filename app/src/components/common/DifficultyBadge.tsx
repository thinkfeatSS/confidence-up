import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Difficulty } from '../../types';
import { BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeColors } from '../../theme/colors';

const buildDifficultyConfig = (colors: ThemeColors) =>
  ({
    easy: { label: 'Easy', color: colors.success, bg: `${colors.success}20` },
    medium: { label: 'Medium', color: colors.xpGold, bg: `${colors.xpGold}20` },
    hard: { label: 'Hard', color: colors.danger, bg: `${colors.danger}20` },
  }) as const;

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md';
}

const _DifficultyBadge = ({ difficulty, size = 'md' }: DifficultyBadgeProps) => {
  const { colors } = useTheme();
  const key = (String(difficulty).toLowerCase() as Difficulty) in buildDifficultyConfig(colors)
    ? (String(difficulty).toLowerCase() as Difficulty)
    : 'easy';
  const config = useMemo(() => buildDifficultyConfig(colors)[key], [colors, key]);
  const isSmall = size === 'sm';
  const badgeStyle = useMemo(
    () => ({
      backgroundColor: config.bg,
      borderColor: `${config.color}50`,
      paddingHorizontal: isSmall ? 7 : 10,
      paddingVertical: isSmall ? 2 : 4,
    }),
    [config.bg, config.color, isSmall],
  );
  const labelStyle = useMemo(
    () => ({ color: config.color, fontSize: isSmall ? 10 : 11 } as const),
    [config.color, isSmall],
  );

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.label, labelStyle]}>{config.label.toUpperCase()}</Text>
    </View>
  );
};
export const DifficultyBadge = React.memo(_DifficultyBadge);

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
