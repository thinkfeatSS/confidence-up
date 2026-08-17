import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useCompleteMission } from '../../hooks/useMissions';
import { useAppContext } from '../../context/AppContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { CategoryChip } from '../../components/common/CategoryChip';
import { DifficultyBadge } from '../../components/common/DifficultyBadge';
import { XPGainFloat } from '../../components/gamification/XPGainFloat';
import { Spacing, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

type Props = StackScreenProps<MainStackParamList, 'MissionDetail'>;

export const MissionDetailScreen = ({ route, navigation }: Props) => {
  const { colors } = useTheme();
  const { mission } = route.params;
  const { mutate: completeMission, isPending } = useCompleteMission();
  const { triggerXPGain } = useAppContext();
  const [showXP, setShowXP] = useState(false);
  const [openTip, setOpenTip] = useState<number | null>(null);

  const handleComplete = () => {
    completeMission(mission.id);
    triggerXPGain(mission.xpReward);
    setShowXP(true);
  };

  const handlePracticeMission = () => {
    navigation.navigate('Tabs', {
      screen: 'Practice',
      params: { prompt: mission.prompt, missionId: mission.id },
    });
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mission</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard glowColor={mission.completed ? colors.success : colors.accentPurple}>
          <View style={styles.metaRow}>
            <CategoryChip category={mission.category} />
            <DifficultyBadge difficulty={mission.difficulty} />
            {mission.isDaily && (
              <View style={[styles.dailyBadge, { borderColor: colors.xpGold, backgroundColor: `${colors.xpGold}25` }]}>
                <Text style={[styles.dailyText, { color: colors.xpGold }]}>📅 Daily</Text>
              </View>
            )}
          </View>
          <Text style={[styles.missionTitle, { color: colors.textPrimary }]}>{mission.title}</Text>
          <Text style={[styles.xpReward, { color: colors.xpGold }]}>+{mission.xpReward} XP 🪙</Text>
        </GlassCard>

        <GlassCard glowColor={colors.accentCyan}>
          <Text style={[styles.promptLabel, { color: colors.accentCyan }]}>🎯 YOUR PROMPT</Text>
          <Text style={[styles.promptText, { color: colors.textPrimary }]}>{mission.prompt}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>ABOUT THIS MISSION</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{mission.description}</Text>
          {mission.whyItHelps && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan, marginTop: 12 }]}>WHY IT HELPS</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{mission.whyItHelps}</Text>
            </>
          )}
        </GlassCard>

        {mission.tips && mission.tips.length > 0 && (
          <GlassCard>
            <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>💡 TIPS FOR SUCCESS</Text>
            {mission.tips.map((tip, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.tipRow, { borderBottomColor: colors.border }]}
                onPress={() => setOpenTip(openTip === i ? null : i)}
                activeOpacity={0.8}>
                <Text style={[styles.tipNumber, { color: colors.textPrimary }]}>Tip {i + 1}</Text>
                <Text style={[styles.tipArrow, { color: colors.textMuted }]}>{openTip === i ? '▲' : '▼'}</Text>
                {openTip === i && <Text style={[styles.tipBody, { color: colors.textSecondary }]}>{tip}</Text>}
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {mission.completed ? (
          <GlassCard style={styles.completedCard}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={[styles.completedTitle, { color: colors.success }]}>Mission Complete!</Text>
            <Text style={[styles.completedSub, { color: colors.textMuted }]}>Great work! Keep the momentum going.</Text>
          </GlassCard>
        ) : (
          <>
            <PrimaryButton label="Practice this mission 🎤" onPress={handlePracticeMission} size="lg" />
            <PrimaryButton
              label="Complete Mission ✅"
              onPress={handleComplete}
              loading={isPending}
              size="md"
              variant="outline"
            />
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {showXP && <XPGainFloat amount={mission.xpReward} onComplete={() => setShowXP(false)} />}
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
  metaRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.sm },
  missionTitle: { fontSize: 20, fontWeight: '800', lineHeight: 28 },
  xpReward: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  promptLabel: { ...(Typography.caption as object), letterSpacing: 1.5, marginBottom: 8 },
  promptText: { fontSize: 18, fontWeight: '600', lineHeight: 28 },
  sectionLabel: { ...(Typography.caption as object), letterSpacing: 1.5, marginBottom: 8 },
  bodyText: { ...(Typography.body as object), lineHeight: 24 },
  tipRow: { paddingVertical: 10, borderBottomWidth: 1, gap: 6 },
  tipNumber: { fontSize: 14, fontWeight: '600' },
  tipArrow: { position: 'absolute', right: 0, top: 12, fontSize: 10 },
  tipBody: { ...(Typography.bodySmall as object), lineHeight: 22 },
  completedCard: { alignItems: 'center', gap: Spacing.sm },
  completedTitle: { fontSize: 18, fontWeight: '700' },
  completedSub: { ...(Typography.body as object), textAlign: 'center' },
  dailyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  dailyText: { fontSize: 11, fontWeight: '600' },
});
