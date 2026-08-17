import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, withSequence, withTiming, withDelay, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface XPGainFloatProps {
  amount: number;
  onComplete?: () => void;
}

const _XPGainFloat = ({ amount, onComplete }: XPGainFloatProps) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withTiming(1.3, { duration: 200 }, () => {
      scale.value = withTiming(1, { duration: 150 });
    });
    translateY.value = withDelay(200, withTiming(-80, { duration: 1000 }));
    opacity.value = withSequence(
      withDelay(600, withTiming(0, { duration: 600 }, () => {
        if (onComplete) runOnJS(onComplete)();
      })),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.text, { color: colors.xpGold, textShadowColor: colors.glowGold }, style]}>
      +{amount} XP 🪙
    </Animated.Text>
  );
};

export const XPGainFloat = React.memo(_XPGainFloat);

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '50%',
    fontSize: 22,
    fontWeight: '800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    zIndex: 999,
  },
});
