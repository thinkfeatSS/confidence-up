import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { PrimaryButton } from '../../components/common/PrimaryButton';

type Props = StackScreenProps<AuthStackParamList, 'Quiz'>;

const FEARS = [
  { id: 'public', label: '🎤 Public Speaking' },
  { id: 'interview', label: '💼 Job Interviews' },
  { id: 'english', label: '🗣️ English Speaking' },
  { id: 'social', label: '🤝 Social Situations' },
  { id: 'teacher', label: '👨‍🏫 Talking to Teachers' },
  { id: 'group', label: '👥 Group Discussions' },
  { id: 'phone', label: '📞 Phone Calls' },
  { id: 'presentation', label: '📊 Presentations' },
];

const GOAL_AREAS = [
  { id: 'academic', label: '📚 Academic Success' },
  { id: 'social', label: '💬 Social Confidence' },
  { id: 'career', label: '🚀 Career Growth' },
  { id: 'communication', label: '📣 Communication Skills' },
];

const TIME_OPTIONS = [
  { id: '5', label: '5 min / day', sub: 'Casual' },
  { id: '15', label: '15 min / day', sub: 'Focused' },
  { id: '30', label: '30 min / day', sub: 'Serious' },
];

const TOTAL_STEPS = 4;

export const QuizScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { completeOnboarding, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedFears, setSelectedFears] = useState<string[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(5);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('15');

  const toggleFear = (id: string) =>
    setSelectedFears(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleArea = (id: string) =>
    setSelectedAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const next = () => {
    if (step < TOTAL_STEPS) { setStep(s => s + 1); }
    else { void finish(); }
  };

  const finish = async () => {
    if (!isAuthenticated) {
      navigation.replace('Login');
      return;
    }

    await completeOnboarding({
      fears: selectedFears,
      goals: selectedAreas,
      dailyTime: selectedTime,
    });
    // AppNavigator switches to Main when hasCompletedOnboarding becomes true
  };

  const progress = step / TOTAL_STEPS;

  return (
    <GradientBackground style={styles.container}>
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <LinearGradient
          colors={[colors.accentPurple, colors.accentCyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress * 100}%` }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.step}>
            <Text style={[styles.stepLabel, { color: colors.accentCyan }]}>Step 1 of 4</Text>
            <Text style={[styles.question, { color: colors.textPrimary }]}>What are you most afraid of?</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>Select all that apply</Text>
            <View style={styles.chipGrid}>
              {FEARS.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    selectedFears.includes(f.id) && { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: colors.accentPurple },
                  ]}
                  onPress={() => toggleFear(f.id)}
                  activeOpacity={0.8}>
                  <Text style={[
                    styles.chipText,
                    { color: colors.textSecondary },
                    selectedFears.includes(f.id) && { color: colors.accentPurpleLight },
                  ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={[styles.stepLabel, { color: colors.accentCyan }]}>Step 2 of 4</Text>
            <Text style={[styles.question, { color: colors.textPrimary }]}>How confident are you right now?</Text>
            <Text style={[styles.heroScore, { color: colors.textPrimary }]}>
              {['😰', '😟', '😐', '🙂', '😊', '😄', '💪', '🌟', '🔥', '⚡'][confidenceScore - 1]} {confidenceScore}/10
            </Text>
            <View style={styles.sliderRow}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.sliderTick,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    n <= confidenceScore && { backgroundColor: colors.accentPurple, borderColor: colors.accentPurple },
                  ]}
                  onPress={() => setConfidenceScore(n)}
                  activeOpacity={0.7}
                />
              ))}
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Not at all</Text>
              <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Very confident</Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={[styles.stepLabel, { color: colors.accentCyan }]}>Step 3 of 4</Text>
            <Text style={[styles.question, { color: colors.textPrimary }]}>What's your main goal?</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>Select all that apply</Text>
            <View style={styles.goalGrid}>
              {GOAL_AREAS.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.goalCard,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    selectedAreas.includes(a.id) && { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: colors.accentPurple },
                  ]}
                  onPress={() => toggleArea(a.id)}
                  activeOpacity={0.8}>
                  <Text style={{ fontSize: 28 }}>{a.label.split(' ')[0]}</Text>
                  <Text style={[
                    styles.goalLabel,
                    { color: colors.textSecondary },
                    selectedAreas.includes(a.id) && { color: colors.accentPurpleLight },
                  ]}>
                    {a.label.split(' ').slice(1).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={[styles.stepLabel, { color: colors.accentCyan }]}>Step 4 of 4</Text>
            <Text style={[styles.question, { color: colors.textPrimary }]}>How much time can you commit?</Text>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.timeCard,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                  selectedTime === t.id && { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: colors.accentPurple },
                ]}
                onPress={() => setSelectedTime(t.id)}
                activeOpacity={0.8}>
                <Text style={[
                  styles.timeLabel,
                  { color: colors.textSecondary },
                  selectedTime === t.id && { color: colors.textPrimary },
                ]}>{t.label}</Text>
                <Text style={[
                  styles.timeSub,
                  { color: colors.textMuted },
                  selectedTime === t.id && { color: colors.accentPurpleLight },
                ]}>{t.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <PrimaryButton
          label={step === TOTAL_STEPS ? "Let's Begin! 🚀" : 'Continue →'}
          onPress={next}
          size="lg"
        />
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressTrack: {
    height: 3,
    marginTop: 56,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
  },
  step: { gap: Spacing.base },
  stepLabel: { ...(Typography.caption as object), letterSpacing: 1.5, textTransform: 'uppercase' },
  question: { fontSize: 22, fontWeight: '800', lineHeight: 30 },
  sub: { ...(Typography.bodySmall as object) },
  heroScore: { fontSize: 48, fontWeight: '900', textAlign: 'center', marginVertical: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  sliderRow: { flexDirection: 'row', gap: 5, marginTop: 8 },
  sliderTick: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { ...(Typography.caption as object) },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  goalCard: {
    width: '45%',
    paddingVertical: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  goalLabel: { ...(Typography.label as object), textAlign: 'center' },
  timeCard: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: { fontSize: 16, fontWeight: '600' },
  timeSub: { ...(Typography.label as object) },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    backgroundColor: 'rgba(10,11,20,0.9)',
    borderTopWidth: 1,
  },
});
