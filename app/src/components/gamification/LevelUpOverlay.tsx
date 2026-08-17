import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, { useSharedValue, withSpring, withSequence, withTiming, withRepeat, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

interface LevelUpOverlayProps {
  visible: boolean;
  newLevel: number;
  newTitle: string;
  onDismiss: () => void;
}

const _LevelUpOverlay = ({ visible, newLevel, newTitle, onDismiss }: LevelUpOverlayProps) => {
  const { colors } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const titleSlide = useSharedValue(40);
  const glowScale = useSharedValue(0);

  const fadeOut = useCallback(() => {
    opacity.value = withTiming(0, { duration: 400 }, () => runOnJS(onDismiss)());
  }, [opacity, onDismiss]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 300 }),
      );
      titleSlide.value = withTiming(0, { duration: 500 });
      glowScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true,
      );

      // Auto-dismiss after 3.5 seconds
      const timer = setTimeout(() => {
        fadeOut();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, fadeOut, opacity, scale, titleSlide, glowScale]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: titleSlide.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glowScale.value }] }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={fadeOut}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <LinearGradient
          colors={['rgba(124,58,237,0.95)', 'rgba(10,11,20,0.97)']}
          style={styles.gradient}>

          <Animated.View style={[styles.glow, glowStyle]} />

          <Text style={[styles.levelUpText, { color: colors.accentCyan }]}>LEVEL UP!</Text>

          <Animated.Text style={[styles.levelNumber, { color: colors.white, textShadowColor: colors.glowPurple }, numberStyle]}>
            {newLevel}
          </Animated.Text>

          <Animated.Text style={[styles.titleText, { color: colors.xpGold }, titleStyle]}>
            {newTitle}
          </Animated.Text>

          <Text style={[styles.subText, { color: colors.textSecondary }]}>You have unlocked a new level of confidence ✨</Text>

          <TouchableOpacity
            style={[styles.continueButton, { borderColor: colors.accentPurpleLight }]}
            onPress={fadeOut}
            activeOpacity={0.8}>
            <Text style={[styles.continueText, { color: colors.accentPurpleLight }]}>Continue →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

export const LevelUpOverlay = React.memo(_LevelUpOverlay);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168,85,247,0.2)',
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
  },
  levelNumber: {
    fontSize: 96,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    lineHeight: 100,
  },
  titleText: {
    ...(Typography.h1 as object),
    textAlign: 'center',
    fontSize: 28,
  },
  subText: {
    ...(Typography.body as object),
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  continueButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 32,
    borderWidth: 1.5,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
