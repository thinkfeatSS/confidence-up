import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getAuthSlideGradient, getOnboardingSlides } from '../../theme/authBrand';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen = ({ navigation }: Props) => {
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const slides = useMemo(() => getOnboardingSlides(isDark, colors), [isDark, colors]);
  const slideBackground = useMemo(() => getAuthSlideGradient(isDark, colors), [isDark, colors]);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
    scrollX.value = withTiming(index * width);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      goTo(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}>
        {slides.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <LinearGradient colors={slideBackground} style={StyleSheet.absoluteFill} />
            <View style={styles.emojiContainer}>
              <LinearGradient
                colors={slide.gradient}
                style={[
                  styles.emojiCircle,
                  {
                    shadowColor: isDark ? colors.glowPurple : 'rgba(124,58,237,0.3)',
                    shadowOpacity: isDark ? 0.6 : 0.35,
                  },
                ]}>
                <Text style={{ fontSize: 52 }}>{slide.emoji}</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.textMuted },
              i === currentIndex && { width: 24, backgroundColor: colors.accentPurple },
            ]}
          />
        ))}
      </View>

      <View style={[styles.btnRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.replace('Login')} activeOpacity={0.6}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient colors={[colors.accentPurple, colors.accentPurpleLight]} style={styles.nextGradient}>
            <Text style={[styles.nextText, { color: colors.white }]}>
              {currentIndex === slides.length - 1 ? 'Get Started →' : 'Next →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 24,
  },
  emojiContainer: { marginBottom: 8 },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  body: {
    ...(Typography.bodyLarge as object),
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 16,
    paddingBottom: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  skipText: {
    ...(Typography.body as object),
  },
  nextBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  nextGradient: { paddingHorizontal: 28, paddingVertical: 14 },
  nextText: { fontSize: 15, fontWeight: '700' },
});
