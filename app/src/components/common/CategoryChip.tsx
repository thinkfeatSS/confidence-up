import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Category } from '../../types';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeColors } from '../../theme/colors';

const buildCategoryConfig = (colors: ThemeColors) =>
  ({
    speaking: { icon: '🎤', label: 'Speaking', color: colors.categorySpeaking },
    social: { icon: '🤝', label: 'Social', color: colors.categorySocial },
    academic: { icon: '📚', label: 'Academic', color: colors.categoryAcademic },
    sports: { icon: '🏃', label: 'Sports', color: colors.categorySports },
    creative: { icon: '🎨', label: 'Creative', color: colors.categoryCreative },
  }) as const;

interface CategoryChipProps {
  category: Category;
  size?: 'sm' | 'md';
}

const _CategoryChip = ({ category, size = 'md' }: CategoryChipProps) => {
  const { colors } = useTheme();
  const config = useMemo(() => buildCategoryConfig(colors)[category], [colors, category]);
  const isSmall = size === 'sm';
  const chipStyle = useMemo(
    () => ({
      backgroundColor: `${config.color}18`,
      borderColor: `${config.color}40`,
      paddingHorizontal: isSmall ? 8 : 12,
      paddingVertical: isSmall ? 3 : 5,
    }),
    [config.color, isSmall],
  );
  const iconSize = isSmall ? 11 : 13;
  const textStyle = useMemo(
    () => ({ color: config.color, fontSize: isSmall ? 11 : 12 } as const),
    [config.color, isSmall],
  );

  return (
    <View style={[styles.chip, chipStyle]}>
      <Text style={[styles.iconText, { fontSize: iconSize }]}>{config.icon}</Text>
      <Text style={[styles.label, textStyle]}>{config.label}</Text>
    </View>
  );
};
export const CategoryChip = React.memo(_CategoryChip);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  iconText: {},
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
