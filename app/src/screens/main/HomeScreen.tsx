import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavProp } from '../../navigation/types';
import { useUser } from '../../hooks/useUser';
import { useTodaysMission } from '../../hooks/useMissions';
import { useFears } from '../../hooks/useFears';
import { useEarnedBadges } from '../../hooks/useBadges';
import { GradientBackground } from '../../components/common/GradientBackground';
import { XPBar } from '../../components/gamification/XPBar';
import { ConfidenceRing } from '../../components/gamification/ConfidenceRing';
import { GlassCard } from '../../components/common/GlassCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { DifficultyBadge } from '../../components/common/DifficultyBadge';
import { CategoryChip } from '../../components/common/CategoryChip';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

const StatRow = React.memo(({ icon, label, value, colors }: {
  icon: string; label: string; value: string; colors: ThemeColors;
}) => (
  <View style={styles.statRow}>
    <Text style={styles.statIcon}>{icon}</Text>
    <View style={styles.statTextBlock}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  </View>
));

const QuickAction = React.memo(({ emoji, label, color, onPress }: {
  emoji: string; label: string; color: string; onPress: () => void;
}) => {
  const btnStyle = useMemo(
    () => [styles.actionBtn, { borderColor: color + '40', backgroundColor: color + '10' }],
    [color],
  );
  const labelStyle = useMemo(() => [styles.actionLabel, { color }], [color]);
  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={labelStyle}>{label}</Text>
    </TouchableOpacity>
  );
});

export const HomeScreen = () => {
  const navigation = useNavigation<MainStackNavProp>();
  const { colors } = useTheme();
  const { data: user } = useUser();
  const { data: todaysMission } = useTodaysMission();
  const { data: fears } = useFears();
  const { data: badges } = useEarnedBadges();

  const earnedBadges = useMemo(() => (badges ?? []).slice(0, 8), [badges]);
  const fearList = useMemo(() => fears ?? [], [fears]);

  const navToDaily = useCallback(
    () => navigation.navigate('Tabs', { screen: 'Missions' }),
    [navigation],
  );
  const navToMission = useCallback(
    () => todaysMission && navigation.navigate('MissionDetail', { mission: todaysMission }),
    [navigation, todaysMission],
  );
  const navToFearTracker = useCallback(() => navigation.navigate('FearTracker'), [navigation]);
  const navToAiCoach = useCallback(() => navigation.navigate('AiCoach'), [navigation]);
  const navToJournal = useCallback(() => navigation.navigate('Journal'), [navigation]);
  const navToBadges = useCallback(() => navigation.navigate('Badges'), [navigation]);
  const navToSkillTree = useCallback(() => navigation.navigate('SkillTree'), [navigation]);
  const navToPractice = useCallback(
    () => navigation.navigate('Tabs', { screen: 'Practice' }),
    [navigation],
  );

  if (!user) return null;

  return (
    <GradientBackground style={styles.container}>
      <XPBar
        level={user.level}
        levelTitle={user.levelTitle}
        xp={user.xp}
        xpToNextLevel={user.xpToNextLevel}
        streak={user.streak}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.greetHi, { color: colors.textPrimary }]}>Hey, {user.name} 👋</Text>
          <Text style={[styles.greetSub, { color: colors.textMuted }]}>Ready to level up today?</Text>
        </View>

        {/* Confidence Ring + Stats */}
        <GlassCard style={styles.ringCard} noPadding>
          <View style={styles.ringRow}>
            <ConfidenceRing score={user.confidenceScore} size={120} />
            <View style={styles.ringStats}>
              <StatRow icon="⚡" label="Total XP" value={user.totalXP.toLocaleString()} colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow icon="🎤" label="Speeches" value={String(user.totalSpeeches)} colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <StatRow icon="✅" label="Challenges" value={String(user.totalChallenges)} colors={colors} />
            </View>
          </View>
        </GlassCard>

        {/* Daily Mission */}
        {todaysMission && (
          <View>
            <SectionHeader title="Today's Mission" actionLabel="Daily Hub" onAction={navToDaily} />
            <TouchableOpacity activeOpacity={0.85} onPress={navToMission}>
              <GlassCard style={styles.missionCard} glowColor={todaysMission.completed ? colors.success : colors.accentPurple}>
                <View style={styles.missionTop}>
                  <View style={styles.missionMeta}>
                    <CategoryChip category={todaysMission.category} />
                    <DifficultyBadge difficulty={todaysMission.difficulty} />
                  </View>
                  {todaysMission.completed && (
                    <View style={[styles.completedBadge, { borderColor: colors.success, backgroundColor: colors.glowGreen }]}>
                      <Text style={[styles.completedText, { color: colors.success }]}>✅ Done</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.missionTitle, { color: colors.textPrimary }]}>{todaysMission.title}</Text>
                <Text style={[styles.missionDesc, { color: colors.textSecondary }]} numberOfLines={2}>{todaysMission.description}</Text>
                <View style={styles.missionFooter}>
                  <Text style={[styles.xpText, { color: colors.xpGold }]}>+{todaysMission.xpReward} XP 🪙</Text>
                  <Text style={[styles.missionArrow, { color: colors.accentCyan }]}>View Mission →</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View>
          <SectionHeader title="Quick Actions" />
          <View style={styles.actionsGrid}>
            <QuickAction emoji="🎤" label="Practice Speaking" color={colors.accentCyan} onPress={navToPractice} />
            <QuickAction emoji="😰" label="Fear Tracker" color={colors.streakOrange} onPress={navToFearTracker} />
            <QuickAction emoji="🤖" label="AI Coach" color={colors.accentPurpleLight} onPress={navToAiCoach} />
            <QuickAction emoji="📔" label="Journal" color={colors.xpGold} onPress={navToJournal} />
          </View>
        </View>

        {/* Fear Journey */}
        {fearList.length > 0 && (
          <View>
            <SectionHeader title="Fear Journey" actionLabel="See All" onAction={navToFearTracker} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {fearList.map(fear => (
                <TouchableOpacity key={fear.id} onPress={navToFearTracker} activeOpacity={0.8}>
                  <GlassCard style={styles.fearCard} padding={14}>
                    <Text style={styles.fearIcon}>{fear.icon}</Text>
                    <Text style={[styles.fearName, { color: colors.textPrimary }]}>{fear.name}</Text>
                    <View style={[styles.fearProgressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.fearProgressFill, {
                        width: `${(fear.currentLevel / fear.levels.length) * 100}%`,
                        backgroundColor: fear.color,
                      }]} />
                    </View>
                    <Text style={[styles.fearLevel, { color: colors.textMuted }]}>Level {fear.currentLevel}/{fear.levels.length}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Badges */}
        {earnedBadges.length > 0 && (
          <View>
            <SectionHeader title="Badges" actionLabel="All Badges" onAction={navToBadges} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {earnedBadges.map(badge => (
                <GlassCard key={badge.id} style={styles.badgeCard} padding={12} glowColor={badge.isNew ? colors.xpGold : undefined}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  {badge.isNew && <View style={[styles.newDot, { backgroundColor: colors.xpGold }]} />}
                  <Text style={[styles.badgeName, { color: colors.textSecondary }]} numberOfLines={2}>{badge.name}</Text>
                </GlassCard>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Skill Tree CTA */}
        <TouchableOpacity onPress={navToSkillTree} activeOpacity={0.85}>
          <GlassCard style={styles.skillTreeCTA} glowColor={colors.accentCyan}>
            <Text style={styles.ctaMapEmoji}>🗺️</Text>
            <View style={styles.ctaText}>
              <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>Skill Tree</Text>
              <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>Unlock speaking, confidence & communication skills</Text>
            </View>
            <Text style={[styles.ctaArrow, { color: colors.accentCyan }]}>→</Text>
          </GlassCard>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 8, paddingHorizontal: Spacing.base, gap: Spacing.lg },
  greeting: { gap: 4 },
  greetHi: { fontSize: 22, fontWeight: '800' },
  greetSub: { ...(Typography.body as object) },
  ringCard: { marginBottom: 4 },
  ringRow: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  ringStats: { flex: 1, gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { fontSize: 14 },
  statTextBlock: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  divider: { height: 1 },
  missionCard: { gap: Spacing.sm },
  missionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missionMeta: { flexDirection: 'row', gap: Spacing.xs },
  completedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  completedText: { fontSize: 12, fontWeight: '600' },
  missionTitle: { fontSize: 16, fontWeight: '700' },
  missionDesc: { ...(Typography.bodySmall as object), lineHeight: 20 },
  missionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  xpText: { fontSize: 13, fontWeight: '700' },
  missionArrow: { fontSize: 13, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionBtn: { width: '47%', borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.base, alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  actionEmoji: { fontSize: 26 },
  horizontalScroll: { paddingRight: Spacing.base, gap: Spacing.sm },
  fearCard: { width: 120, alignItems: 'center', gap: 8 },
  fearIcon: { fontSize: 28 },
  fearName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  fearProgressBar: { width: '100%', height: 4, borderRadius: 2 },
  fearProgressFill: { height: 4, borderRadius: 2 },
  fearLevel: { fontSize: 11 },
  badgeCard: { width: 88, alignItems: 'center', gap: 6, position: 'relative' },
  badgeIcon: { fontSize: 26 },
  badgeName: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  newDot: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5 },
  skillTreeCTA: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ctaMapEmoji: { fontSize: 32 },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 15, fontWeight: '700' },
  ctaSub: { fontSize: 12, marginTop: 2 },
  ctaArrow: { fontSize: 18 },
  bottomSpacer: { height: Spacing.xxl },
});
