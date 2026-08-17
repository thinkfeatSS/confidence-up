import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavProp } from '../../navigation/types';
import { useUser } from '../../hooks/useUser';
import { useProgress, useConfidenceHistory, useSpeechSessions } from '../../hooks/useProgress';
import { useBadges } from '../../hooks/useBadges';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { ConfidenceRing } from '../../components/gamification/ConfidenceRing';
import { StatCard } from '../../components/gamification/StatCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { Spacing, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const CHART_PAD = 12;

const LineChart = React.memo(({ data, strokeColor, dotColor }: {
  data: Array<{ score: number }>; strokeColor: string; dotColor: string;
}) => {
  if (!data.length) return null;
  const min = Math.min(...data.map(d => d.score)) - 5;
  const max = Math.max(...data.map(d => d.score)) + 5;
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = CHART_PAD + (i / Math.max(data.length - 1, 1)) * (CHART_WIDTH - CHART_PAD * 2);
    const y = CHART_PAD + (1 - (d.score - min) / range) * (CHART_HEIGHT - CHART_PAD * 2);
    return `${x},${y}`;
  });
  const last = points[points.length - 1]?.split(',');
  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Polyline points={points.join(' ')} fill="none" stroke={strokeColor} strokeWidth={2} />
      {last && <Circle cx={last[0]} cy={last[1]} r={4} fill={dotColor} />}
    </Svg>
  );
});

export const ProgressScreen = () => {
  const navigation = useNavigation<MainStackNavProp>();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const { data: user } = useUser();
  const { data: progress } = useProgress();
  const { data: history } = useConfidenceHistory(period);
  const { data: speechSessions } = useSpeechSessions();
  const { data: badges } = useBadges();

  const earnedBadges = useMemo(() => (badges ?? []).filter(b => b.earned), [badges]);
  const monthlyTimeline = useMemo(() => {
    const groups = new Map<string, { total: number; count: number; best: number }>();
    for (const session of speechSessions ?? []) {
      const date = new Date(session.date);
      const key = Number.isNaN(date.getTime())
        ? session.date.slice(0, 7)
        : date.toLocaleString('default', { month: 'long' });
      const current = groups.get(key) ?? { total: 0, count: 0, best: 0 };
      current.total += session.overallScore;
      current.count += 1;
      current.best = Math.max(current.best, session.overallScore);
      groups.set(key, current);
    }
    return Array.from(groups.entries()).slice(0, 6).map(([month, item]) => ({
      month,
      average: Math.round(item.total / item.count),
      best: item.best,
      count: item.count,
    }));
  }, [speechSessions]);

  const setWeek = useCallback(() => setPeriod('week'), []);
  const setMonth = useCallback(() => setPeriod('month'), []);
  const periodHandlers = useMemo(() => ({ week: setWeek, month: setMonth }), [setWeek, setMonth]);
  const navToBadges = useCallback(() => navigation.navigate('Badges'), [navigation]);

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>📊 Your Progress</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Track your confidence journey</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Confidence Ring */}
        {user && (
          <GlassCard style={styles.ringCard} noPadding>
            <View style={styles.ringRow}>
              <ConfidenceRing score={user.confidenceScore} size={140} />
              <View style={styles.ringInfo}>
                <Text style={[styles.ringLevel, { color: colors.textPrimary }]}>{user.levelTitle}</Text>
                <Text style={[styles.ringXP, { color: colors.xpGold }]}>{user.totalXP.toLocaleString()} Total XP</Text>
                <View style={styles.streakRow}>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                  <Text style={[styles.streakText, { color: colors.streakOrange }]}>{user.streak} day streak</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Growth Intelligence */}
        {progress?.growthMetrics && (
          <View>
            <SectionHeader title="Growth Intelligence" />
            <View style={styles.statsGrid}>
              <StatCard icon="🏆" value={progress.growthMetrics.confidence.best} label="Best Score" color={colors.success} />
              <StatCard icon="📊" value={progress.growthMetrics.confidence.average} label="Average" color={colors.accentCyan} />
              <StatCard
                icon="📈"
                value={`${progress.growthMetrics.confidence.growthPercent > 0 ? '+' : ''}${progress.growthMetrics.confidence.growthPercent}%`}
                label="Confidence Growth"
                color={colors.accentPurpleLight}
              />
              <StatCard
                icon="📚"
                value={`${progress.growthMetrics.vocabulary.growthPercent > 0 ? '+' : ''}${progress.growthMetrics.vocabulary.growthPercent}%`}
                label="Vocab Growth"
                color={colors.xpGold}
              />
              <StatCard
                icon="🗣️"
                value={`${progress.growthMetrics.wpm.changePercent > 0 ? '+' : ''}${progress.growthMetrics.wpm.changePercent}%`}
                label="WPM Change"
                color={colors.accentCyan}
              />
              <StatCard
                icon="⏸️"
                value={`${progress.growthMetrics.pauses.reductionPercent}%`}
                label="Pause Reduction"
                color={colors.success}
              />
              <StatCard
                icon="🔥"
                value={progress.growthMetrics.consistency.streakDays}
                label="Day Streak"
                color={colors.streakOrange}
              />
            </View>
          </View>
        )}

        {/* Confidence Chart */}
        <GlassCard>
          <View style={styles.chartHeader}>
            <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>CONFIDENCE HISTORY</Text>
            <View style={[styles.periodToggle, { backgroundColor: colors.bgCard }]}>
              {(['week', 'month'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && { backgroundColor: colors.accentPurple }]}
                  onPress={periodHandlers[p]}>
                  <Text style={[styles.periodText, { color: colors.textMuted }, period === p && { color: colors.white }]}>
                    {p === 'week' ? '7D' : '30D'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <LineChart data={history ?? []} strokeColor={colors.accentPurple} dotColor={colors.accentCyan} />
          <View style={styles.chartLabels}>
            <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{period === 'week' ? '7 days ago' : '30 days ago'}</Text>
            <Text style={[styles.chartLabel, { color: colors.textMuted }]}>Today</Text>
          </View>
        </GlassCard>

        {/* Stats Grid */}
        {progress && (
          <View>
            <SectionHeader title="Statistics" />
            <View style={styles.statsGrid}>
              <StatCard icon="⚡" value={progress.totalXP.toLocaleString()} label="Total XP" color={colors.xpGold} />
              <StatCard icon="📅" value={progress.weeklyXP} label="Weekly XP" color={colors.accentCyan} />
              <StatCard icon="🔥" value={progress.bestStreak} label="Best Streak" color={colors.streakOrange} />
              <StatCard icon="🎤" value={progress.totalSpeeches} label="Speeches" color={colors.accentPurpleLight} />
              <StatCard icon="✅" value={progress.totalChallenges} label="Challenges" color={colors.success} />
              <StatCard icon="🎯" value={`${progress.averageScore}%`} label="Avg Score" color={colors.accentCyan} />
            </View>
          </View>
        )}

        {/* Recent Badges */}
        {earnedBadges.length > 0 && (
          <View>
            <SectionHeader title="Recent Badges" actionLabel="All Badges" onAction={navToBadges} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
              {earnedBadges.slice(0, 8).map(badge => (
                <GlassCard key={badge.id} style={styles.badgeCard} padding={12}>
                  <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
                  <Text style={[styles.badgeName, { color: colors.textSecondary }]} numberOfLines={2}>{badge.name}</Text>
                </GlassCard>
              ))}
            </ScrollView>
          </View>
        )}

        {monthlyTimeline.length > 0 && (
          <View>
            <SectionHeader title="Progress Timeline" />
            <GlassCard>
              {monthlyTimeline.map((item, index) => (
                <View key={`${item.month}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineMonthBlock}>
                    <Text style={[styles.timelineMonth, { color: colors.textPrimary }]}>{item.month}</Text>
                    <Text style={[styles.timelineMeta, { color: colors.textMuted }]}>{item.count} session{item.count === 1 ? '' : 's'}</Text>
                  </View>
                  <View style={[styles.timelineBarTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.timelineBarFill, { width: `${item.average}%`, backgroundColor: colors.accentPurpleLight }]} />
                  </View>
                  <Text style={[styles.timelineScore, { color: colors.accentCyan }]}>{item.average}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* Speech history CTA */}
        <GlassCard style={styles.speechCTA} glowColor={colors.accentPurple}>
          <Text style={{ fontSize: 28 }}>📈</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>Practice More</Text>
            <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>Your average score is improving 🎉</Text>
          </View>
        </GlassCard>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { ...(Typography.bodySmall as object) },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.lg, paddingBottom: 80 },
  ringCard: {},
  ringRow: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 20 },
  ringInfo: { flex: 1, gap: 8 },
  ringLevel: { fontSize: 16, fontWeight: '700' },
  ringXP: { ...(Typography.body as object) },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { fontSize: 14, fontWeight: '600' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { ...(Typography.caption as object), letterSpacing: 1.5 },
  periodToggle: { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 3 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  periodText: { fontSize: 12, fontWeight: '600' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartLabel: { fontSize: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeScroll: { gap: Spacing.sm, paddingRight: Spacing.base },
  badgeCard: { width: 80, alignItems: 'center', gap: 6 },
  badgeName: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 12 },
  timelineMonthBlock: { width: 86 },
  timelineMonth: { fontSize: 13, fontWeight: '700' },
  timelineMeta: { fontSize: 10, marginTop: 2 },
  timelineBarTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  timelineBarFill: { height: 8, borderRadius: 4 },
  timelineScore: { width: 30, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  speechCTA: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ctaTitle: { fontSize: 15, fontWeight: '700' },
  ctaSub: { fontSize: 12, marginTop: 2 },
});
