import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, { useSharedValue, withSpring, withSequence, withTiming, withRepeat, useAnimatedStyle } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Badge } from '../../types';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

interface BadgeUnlockSheetProps {
  badge: Badge | null;
  visible: boolean;
  onDismiss: () => void;
  subtitle?: string;
}

const _BadgeUnlockSheet = ({ badge, visible, onDismiss, subtitle = 'ACHIEVEMENT UNLOCKED' }: BadgeUnlockSheetProps) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(300);
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      iconScale.value = withSequence(
        withSpring(1.4, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 15, stiffness: 400 }),
      );
      iconRotate.value = withSequence(
        withTiming(-0.15, { duration: 150 }),
        withTiming(0.15, { duration: 150 }),
        withTiming(0, { duration: 100 }),
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 600 }), withTiming(0.4, { duration: 600 })),
        4,
        true,
      );
    } else {
      translateY.value = withTiming(300, { duration: 250 });
    }
  }, [visible, translateY, iconScale, iconRotate, glowOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotate.value}rad` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  if (!badge) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <LinearGradient
            colors={[colors.bgCard, colors.bgCardElevated]}
            style={[styles.sheetInner, { borderColor: colors.borderAccent }]}>
            <Text style={[styles.subtitle, { color: colors.accentCyan }]}>{subtitle}</Text>

            <View style={styles.iconWrapper}>
              <Animated.View style={[styles.glow, { backgroundColor: colors.xpGold }, glowStyle]} />
              <Animated.Text style={[styles.icon, iconStyle]}>{badge.icon}</Animated.Text>
            </View>

            <Text style={[styles.badgeName, { color: colors.textPrimary }]}>{badge.name}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{badge.description}</Text>

            <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.accentPurple, colors.accentPurpleLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}>
                <Text style={[styles.buttonText, { color: colors.white }]}>Awesome! 🎉</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const BadgeUnlockSheet = React.memo(_BadgeUnlockSheet);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheetInner: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    borderTopWidth: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Spacing.lg,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.15,
  },
  icon: {
    fontSize: 72,
  },
  badgeName: {
    ...(Typography.h1 as object),
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...(Typography.body as object),
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  button: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
