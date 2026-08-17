import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

const Dot = React.memo(({ delay, color }: { delay: number; color: string }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withRepeat(
        withSequence(withTiming(-6, { duration: 350 }), withTiming(0, { duration: 350 })),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
});

export const TypingIndicator = React.memo(() => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.aiAvatar,
          { borderColor: colors.borderCyan, backgroundColor: `${colors.accentCyan}20` },
        ]}>
        <Animated.Text style={styles.aiEmoji}>🤖</Animated.Text>
      </View>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            borderLeftColor: colors.accentCyan,
          },
        ]}>
        <Dot delay={0} color={colors.accentCyan} />
        <Dot delay={150} color={colors.accentCyan} />
        <Dot delay={300} color={colors.accentCyan} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderLeftWidth: 2,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  aiEmoji: {
    fontSize: 14,
  },
});
