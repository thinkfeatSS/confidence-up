import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ConfidenceRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ConfidenceRing = React.memo(({ score, size = 120, strokeWidth = 10, showLabel = true }: ConfidenceRingProps) => {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreColor = score >= 70 ? colors.success : score >= 45 ? colors.xpGold : colors.danger;
  const containerStyle = useMemo(
    () => ({ width: size, height: size, justifyContent: 'center' as const, alignItems: 'center' as const }),
    [size],
  );
  const scoreTextStyle = useMemo(
    () => [styles.score, { color: scoreColor, fontSize: size > 100 ? 32 : 20 }],
    [scoreColor, size],
  );
  const labelTextStyle = useMemo(
    () => [styles.label, { color: colors.textMuted, fontSize: size > 100 ? 11 : 9 }],
    [colors.textMuted, size],
  );

  return (
    <View style={containerStyle}>
      <Svg width={size} height={size} style={styles.svgAbsolute}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Glow ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`${scoreColor}20`}
          strokeWidth={strokeWidth + 6}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {showLabel && (
        <View style={styles.center}>
          <Text style={scoreTextStyle}>{score}</Text>
          <Text style={labelTextStyle}>SCORE</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  svgAbsolute: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
  },
  score: {
    fontWeight: '800',
    lineHeight: 36,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: -2,
  },
});
