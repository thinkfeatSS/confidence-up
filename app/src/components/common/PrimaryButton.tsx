import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Typography, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const _PrimaryButton = ({
  label,
  onPress,
  style,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'lg',
}: PrimaryButtonProps) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const height = size === 'sm' ? 40 : size === 'md' ? 48 : 56;
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 16;

  if (variant === 'outline') {
    return (
      <AnimatedTouchable
        style={[
          styles.base,
          { height, borderWidth: 1.5, borderColor: colors.accentPurple, borderRadius: BorderRadius.full },
          animatedStyle,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}>
        <Text style={[Typography.h3 as any, { fontSize, color: colors.accentPurpleLight }]}>{label}</Text>
      </AnimatedTouchable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedTouchable
        style={[styles.base, { height }, animatedStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}>
        <Text style={[Typography.h3 as any, { fontSize, color: colors.accentPurpleLight }]}>{label}</Text>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      style={[
        animatedStyle,
        style,
        {
          borderRadius: BorderRadius.full,
          overflow: 'hidden',
          shadowColor: colors.glowPurple,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}>
      <LinearGradient
        colors={[colors.accentPurple, colors.accentPurpleLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { height }]}>
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={[styles.label, { fontSize, color: colors.white }]}>{label}</Text>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export const PrimaryButton = React.memo(_PrimaryButton);
