import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useCompleteChallenge } from '../../hooks/useChallenges';
import { useAppContext } from '../../context/AppContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { CategoryChip } from '../../components/common/CategoryChip';
import { DifficultyBadge } from '../../components/common/DifficultyBadge';
import { XPGainFloat } from '../../components/gamification/XPGainFloat';
import { Spacing, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

type Props = StackScreenProps<MainStackParamList, 'ChallengeDetail'>;

export const ChallengeDetailScreen = ({ route, navigation }: Props) => {
  const { colors } = useTheme();
  const { challenge } = route.params;
  const { mutate: complete, isPending } = useCompleteChallenge();
  const { triggerXPGain } = useAppContext();
  const [showXP, setShowXP] = useState(false);

  const isSpeakingChallenge = challenge.category === 'speaking';

  const handleComplete = () => {
    complete(challenge.id);
    triggerXPGain(challenge.xpReward);
    setShowXP(true);
  };

  const handleStartSpeakingPractice = () => {
    // Navigate directly into Speaking Practice Tab with this challenge prompt
    navigation.navigate('Tabs', {
      screen: 'Practice',
      params: {
        prompt: `${challenge.title}: ${challenge.description}`,
        challengeId: challenge.id,
      },
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Challenge</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard glowColor={challenge.completed ? colors.success : colors.accentPurple}>
          <View style={styles.metaRow}>
            <CategoryChip category={challenge.category} />
            <DifficultyBadge difficulty={challenge.difficulty} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{challenge.title}</Text>
          <Text style={[styles.xp, { color: colors.xpGold }]}>+{challenge.xpReward} XP 🪙</Text>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>ABOUT THIS CHALLENGE</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{challenge.description}</Text>
          {challenge.whyItHelps && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan, marginTop: 14 }]}>
                WHY IT HELPS
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{challenge.whyItHelps}</Text>
            </>
          )}
        </GlassCard>

        {challenge.tips && challenge.tips.length > 0 && (
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>💡 TIPS</Text>
            {challenge.tips.map((tip, i) => (
              <Text key={i} style={[styles.tip, { color: colors.textSecondary }]}>
                • {tip}
              </Text>
            ))}
          </GlassCard>
        )}

        {challenge.completed ? (
          <GlassCard style={styles.doneCard}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={[styles.doneTitle, { color: colors.success }]}>Challenge Complete!</Text>
          </GlassCard>
        ) : isSpeakingChallenge ? (
          <View style={styles.speakingActionContainer}>
            <PrimaryButton
              label="Start Speaking Practice 🎙️"
              onPress={handleStartSpeakingPractice}
              size="lg"
            />
            <Text style={[styles.speakingHint, { color: colors.accentCyan }]}>
              🎤 Complete this task by speaking into the AI studio. Your score and challenge progress will be recorded automatically!
            </Text>
          </View>
        ) : (
          <PrimaryButton
            label="Mark as Complete ✅"
            onPress={handleComplete}
            loading={isPending}
            size="lg"
          />
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {showXP && <XPGainFloat amount={challenge.xpReward} onComplete={() => setShowXP(false)} />}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 60 },
  metaRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  title: { fontSize: 20, fontWeight: '800', lineHeight: 28 },
  xp: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  sectionLabel: { ...(Typography.caption as object), letterSpacing: 1.5, marginBottom: 8 },
  body: { ...(Typography.body as object), lineHeight: 24 },
  tip: { ...(Typography.body as object), lineHeight: 26, marginBottom: 4 },
  doneCard: { alignItems: 'center', gap: Spacing.sm },
  doneTitle: { fontSize: 18, fontWeight: '700' },
  speakingActionContainer: {
    gap: Spacing.sm,
  },
  speakingHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
  },
});
