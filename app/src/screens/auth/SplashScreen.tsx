import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BrandHeroBackground } from '../../components/common/BrandHeroBackground';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

export const SplashScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  useEffect(() => {
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 500, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 300 }),
    );
    logoOpacity.value = withTiming(1, { duration: 400 });
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));

    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          return;
        }
        navigation.replace('Onboarding');
      }, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <BrandHeroBackground style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logoCircleWrapper}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.appName, { color: colors.textPrimary }]}>Truefluent AI</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { color: colors.textSecondary }, taglineStyle]}>
        Voice & Speech Intelligence{'\n'}Real-World Confidence
      </Animated.Text>

      <View style={styles.footer}>
        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
        <View style={[styles.dot, { width: 20, backgroundColor: colors.accentPurple }]} />
        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
      </View>
    </BrandHeroBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoCircleWrapper: {
    width: 110,
    height: 110,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tagline: {
    ...(Typography.body as object),
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
