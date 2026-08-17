import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { LevelBadge } from './LevelBadge';

interface XPBarProps {
  xp: number;
  xpToNextLevel: number;
  level: number;
  levelTitle: string;
  streak: number;
}

export const XPBar = React.memo(({ xp, xpToNextLevel, level, levelTitle, streak }: XPBarProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const targetProgress = Math.min(xp / xpToNextLevel, 1);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, progress]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: colors.bgSecondary,
          borderBottomColor: colors.border,
        },
      ]}>
      <LevelBadge level={level} size="md" />
      <View style={styles.barSection}>
        <View style={styles.labelRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{levelTitle}</Text>
          <Text style={[styles.xpLabel, { color: colors.xpGold }]}>
            {xp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
          </Text>
        </View>
        <View style={[styles.trackOuter, { backgroundColor: colors.border }]}>
          <Animated.View style={[styles.trackInner, animatedBarStyle]}>
            <LinearGradient
              colors={[colors.accentPurple, colors.accentCyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
      <View
        style={[
          styles.streakBadge,
          {
            backgroundColor: colors.glowOrange,
            borderColor: colors.streakOrange + '55',
          },
        ]}>
        <Text style={styles.streakFire}>🔥</Text>
        <Text style={[styles.streakNum, { color: colors.streakOrange }]}>{streak}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  barSection: {
    flex: 1,
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  trackOuter: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  trackInner: {
    height: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  streakFire: {
    fontSize: 12,
  },
  streakNum: {
    fontSize: 13,
    fontWeight: '800',
  },
});
