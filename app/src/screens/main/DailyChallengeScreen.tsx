import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackNavProp } from '../../navigation/types';
import { useDailyHub } from '../../hooks/useDailyHub';
import { useUser } from '../../hooks/useUser';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { CategoryChip } from '../../components/common/CategoryChip';
import { DifficultyBadge } from '../../components/common/DifficultyBadge';
import { StreakFlame } from '../../components/gamification/StreakFlame';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme';

export const DailyChallengeScreen = () => {
  const navigation = useNavigation<MainStackNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: user } = useUser();
  const { data: hub, isLoading, refetch, isRefetching } = useDailyHub();

  const openMission = useCallback(() => {
    if (hub?.mission) navigation.navigate('MissionDetail', { mission: hub.mission });
  }, [hub?.mission, navigation]);

  const practiceMission = useCallback(() => {
    if (!hub?.mission) return;
    navigation.navigate('Tabs', {
      screen: 'Practice',
      params: { prompt: hub.mission.prompt, missionId: hub.mission.id },
    });
  }, [hub?.mission, navigation]);

  const openChallenge = useCallback(() => {
    if (hub?.challenge) navigation.navigate('ChallengeDetail', { challenge: hub.challenge });
  }, [hub?.challenge, navigation]);

  const browseAll = useCallback(() => navigation.navigate('ChallengesBrowse'), [navigation]);

  const todayLabel = hub?.date
    ? new Date(hub.date + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : 'Today';

  return (
    <GradientBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.sm }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accentPurple} />
        }>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>☀️ Daily Challenge</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>{todayLabel}</Text>
          </View>
          {user ? <StreakFlame streak={hub?.streak ?? user.streak} /> : null}
        </View>

        <GlassCard glowColor={colors.accentPurple}>
          <Text style={[styles.tipLabel, { color: colors.accentCyan }]}>COACH TIP</Text>
          <Text style={[styles.tipText, { color: colors.textPrimary }]}>
            {hub?.tip ?? 'Show up for one small win today.'}
          </Text>
        </GlassCard>

        {hub?.stats.dailyGoalMet ? (
          <GlassCard glowColor={colors.success} style={styles.goalMet}>
            <Text style={{ fontSize: 28 }}>🎉</Text>
            <Text style={[styles.goalTitle, { color: colors.success }]}>Daily goal complete!</Text>
            <Text style={[styles.goalSub, { color: colors.textSecondary }]}>
              You finished today&apos;s mission. Keep your streak alive tomorrow.
            </Text>
          </GlassCard>
        ) : null}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TODAY&apos;S MISSION</Text>
        {isLoading ? (
          <Text style={[styles.loading, { color: colors.textMuted }]}>Loading today&apos;s mission…</Text>
        ) : hub?.mission ? (
          <TouchableOpacity activeOpacity={0.9} onPress={openMission}>
            <GlassCard
              glowColor={hub.mission.completed ? colors.success : colors.accentPurple}
              style={styles.heroCard}>
              <View style={styles.cardTop}>
                <View style={styles.metaRow}>
                  <CategoryChip category={hub.mission.category} />
                  <DifficultyBadge difficulty={hub.mission.difficulty} />
                </View>
                {hub.mission.completed ? (
                  <Text style={[styles.donePill, { color: colors.success }]}>✅ Done</Text>
                ) : (
                  <Text style={[styles.xpPill, { color: colors.xpGold }]}>+{hub.mission.xpReward} XP</Text>
                )}
              </View>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{hub.mission.title}</Text>
              <Text style={[styles.heroDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                {hub.mission.description}
              </Text>
              <Text style={[styles.promptPreview, { color: colors.accentCyan }]}>
                🎯 {hub.mission.prompt}
              </Text>
              {!hub.mission.completed && (
                <View style={styles.ctaRow}>
                  <PrimaryButton
                    label="Practice now 🎤"
                    onPress={practiceMission}
                    size="sm"
                    style={styles.ctaBtn}
                  />
                  <PrimaryButton
                    label="Details"
                    onPress={openMission}
                    variant="outline"
                    size="sm"
                    style={styles.ctaBtn}
                  />
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <GlassCard>
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No mission assigned yet. Pull to refresh.
            </Text>
          </GlassCard>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BONUS CHALLENGE</Text>
        {hub?.challenge ? (
          <TouchableOpacity activeOpacity={0.9} onPress={openChallenge}>
            <GlassCard style={styles.bonusCard}>
              <View style={styles.cardTop}>
                <View style={styles.metaRow}>
                  <CategoryChip category={hub.challenge.category} />
                  <DifficultyBadge difficulty={hub.challenge.difficulty} />
                </View>
                <Text style={[styles.bonusTag, { color: colors.streakOrange }]}>Real-world</Text>
              </View>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{hub.challenge.title}</Text>
              <Text style={[styles.heroDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {hub.challenge.description}
              </Text>
              <Text style={[styles.xpPill, { color: colors.xpGold, marginTop: 8 }]}>
                +{hub.challenge.xpReward} XP
                {hub.challenge.completed ? ' · Completed' : ''}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        ) : null}

        <GlassCard style={styles.statsRow}>
          <Stat label="Level" value={String(hub?.level ?? user?.level ?? 1)} colors={colors} />
          <Stat label="Total XP" value={(hub?.xpTotal ?? user?.totalXP ?? 0).toLocaleString()} colors={colors} />
          <Stat label="Best streak" value={String(hub?.longestStreak ?? 0)} colors={colors} />
        </GlassCard>

        <PrimaryButton label="Browse all challenges ⚔️" onPress={browseAll} variant="outline" />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </GradientBackground>
  );
};

const Stat = ({ label, value, colors }: { label: string; value: string; colors: any }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { ...(Typography.bodySmall as object), marginTop: 4 },
  tipLabel: { ...(Typography.caption as object), letterSpacing: 1.2, marginBottom: 6 },
  tipText: { ...(Typography.body as object), lineHeight: 24, fontWeight: '600' },
  goalMet: { alignItems: 'center', gap: 8 },
  goalTitle: { fontSize: 17, fontWeight: '800' },
  goalSub: { ...(Typography.bodySmall as object), textAlign: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  loading: { textAlign: 'center', paddingVertical: 24 },
  heroCard: { gap: 10 },
  bonusCard: { gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', lineHeight: 26 },
  heroDesc: { ...(Typography.bodySmall as object), lineHeight: 22 },
  promptPreview: { ...(Typography.bodySmall as object), fontStyle: 'italic', marginTop: 4 },
  xpPill: { fontSize: 13, fontWeight: '800' },
  donePill: { fontSize: 13, fontWeight: '700' },
  bonusTag: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  ctaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 8 },
  ctaBtn: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  empty: { textAlign: 'center', ...(Typography.body as object) },
});
