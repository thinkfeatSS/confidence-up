import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getOnboardingSlides } from '../../theme/authBrand';
import { BrandHeroBackground } from '../../components/common/BrandHeroBackground';

type Props = StackScreenProps<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen = ({ navigation }: Props) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const slides = useMemo(() => getOnboardingSlides(isDark, colors), [isDark, colors]);

  // Responsive dimensions calculation
  const isShortScreen = height < 700;
  const isCompactWidth = width < 360;
  const circleSize = Math.min(
    Math.max(width * 0.24, isShortScreen ? 72 : 88),
    Math.max(height * 0.14, isShortScreen ? 72 : 88),
    116
  );

  // Sync scroll position if screen dimensions or orientation change
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: currentIndex * width, animated: false });
  }, [width, currentIndex]);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
    scrollX.value = withTiming(index * width);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / width);
    if (pageIndex >= 0 && pageIndex < slides.length && pageIndex !== currentIndex) {
      setCurrentIndex(pageIndex);
      scrollX.value = withTiming(pageIndex * width);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goTo(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <BrandHeroBackground style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {slides.map((slide, i) => (
          <View
            key={i}
            style={[
              styles.slide,
              {
                width,
                paddingTop: insets.top + (isShortScreen ? 12 : 24),
              },
            ]}>
            <View style={styles.slideContent}>
              <View style={styles.emojiContainer}>
                <LinearGradient
                  colors={slide.gradient}
                  style={[
                    styles.emojiCircle,
                    {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      shadowColor: isDark ? colors.glowPurple : 'rgba(124,58,237,0.3)',
                      shadowOpacity: isDark ? 0.6 : 0.35,
                    },
                  ]}>
                  <Text style={{ fontSize: Math.round(circleSize * 0.44) }}>{slide.emoji}</Text>
                </LinearGradient>
              </View>

              <Text
                style={[
                  styles.title,
                  {
                    color: colors.textPrimary,
                    fontSize: isCompactWidth ? 20 : isShortScreen ? 22 : 24,
                    lineHeight: isCompactWidth ? 28 : isShortScreen ? 30 : 32,
                  },
                ]}>
                {slide.title}
              </Text>

              <Text
                style={[
                  styles.body,
                  {
                    color: colors.textSecondary,
                    fontSize: isCompactWidth ? 13 : 15,
                    lineHeight: isCompactWidth ? 20 : 23,
                  },
                ]}>
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomControls}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goTo(i)}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1}`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.textMuted },
                  i === currentIndex && [
                    styles.activeDot,
                    { backgroundColor: colors.accentPurple },
                  ],
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.btnRow,
            {
              borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}>
          <TouchableOpacity
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={currentIndex === slides.length - 1 ? 'Get Started' : 'Next slide'}>
            <LinearGradient
              colors={[colors.accentPurple, colors.accentPurpleLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}>
              <Text style={[styles.nextText, { color: colors.white }]}>
                {currentIndex === slides.length - 1 ? 'Get Started →' : 'Next →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </BrandHeroBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  slideContent: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  emojiContainer: {
    marginBottom: 6,
  },
  emojiCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 15,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    ...(Typography.body as object),
    textAlign: 'center',
  },
  bottomControls: {
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipText: {
    ...(Typography.body as object),
    fontWeight: '600',
  },
  nextBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: 'rgba(124, 58, 237, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  nextGradient: {
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
