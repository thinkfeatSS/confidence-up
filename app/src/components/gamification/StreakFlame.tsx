import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface StreakFlameProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakFlame = ({ streak, size = 'md' }: StreakFlameProps) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 22 : 30;
  const numSize = size === 'sm' ? 13 : size === 'md' ? 17 : 22;

  return (
    <View style={styles.container}>
      <Animated.Text style={[{ fontSize: iconSize }, animatedStyle]}>🔥</Animated.Text>
      <Text style={[styles.number, { fontSize: numSize, color: streak > 0 ? colors.streakOrange : colors.textMuted }]}>
        {streak}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  number: {
    fontWeight: '800',
  },
});
