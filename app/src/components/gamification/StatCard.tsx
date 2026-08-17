import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../common/GlassCard';
import { Typography, Spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

export const StatCard = React.memo(({ icon, value, label, color }: StatCardProps) => {
  const { colors } = useTheme();
  const accent = color ?? colors.accentPurpleLight;
  return (
    <GlassCard style={styles.card} padding={14}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 80,
  },
  icon: {
    fontSize: 22,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    ...(Typography.caption as object),
    textAlign: 'center',
  },
});
