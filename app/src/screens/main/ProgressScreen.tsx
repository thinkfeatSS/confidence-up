import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Svg, { Polyline, Polygon, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
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
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { SpeechSession } from '../../types';

const CHART_HEIGHT = 140;
const CHART_PAD_LEFT = 28;
const CHART_PAD_RIGHT = 16;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 22;

const EnhancedLineChart = React.memo(({
  data,
  strokeColor,
  fillColor,
}: {
  data: Array<{ score: number; date?: string; label?: string }>;
  strokeColor: string;
  fillColor: string;
}) => {
  const [chartWidth, setChartWidth] = useState(320);
  const { colors } = useTheme();

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 100) setChartWidth(w);
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { score: 65, label: 'Start' },
        { score: 70, label: 'Mid' },
        { score: 75, label: 'Now' },
      ];
    }
    if (data.length === 1) {
      return [
        { score: Math.max(20, data[0].score - 10), label: 'Prev' },
        { score: data[0].score, label: 'Current' },
      ];
    }
    return data;
  }, [data]);

  const min = Math.min(40, ...chartData.map((d) => d.score));
  const max = Math.max(100, ...chartData.map((d) => d.score));
  const range = max - min || 1;

  const widthAvailable = chartWidth - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const heightAvailable = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  const points = chartData.map((d, i) => {
    const x = CHART_PAD_LEFT + (i / Math.max(chartData.length - 1, 1)) * widthAvailable;
    const y = CHART_PAD_TOP + (1 - (d.score - min) / range) * heightAvailable;
    return { x, y, score: d.score, label: d.label ?? d.date };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const polygonStr = `${CHART_PAD_LEFT},${CHART_HEIGHT - CHART_PAD_BOTTOM} ${polylineStr} ${
    points[points.length - 1].x
  },${CHART_HEIGHT - CHART_PAD_BOTTOM}`;

  return (
    <View onLayout={handleLayout} style={styles.chartContainer}>
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity="0.35" />
            <Stop offset="1" stopColor={strokeColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = CHART_PAD_TOP + ratio * heightAvailable;
          const scoreVal = Math.round(max - ratio * (max - min));
          return (
            <React.Fragment key={idx}>
              <Line
                x1={CHART_PAD_LEFT}
                y1={y}
                x2={chartWidth - CHART_PAD_RIGHT}
                y2={y}
                stroke={colors.border}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <SvgText
                x={CHART_PAD_LEFT - 6}
                y={y + 3}
                fill={colors.textMuted}
                fontSize={9}
                textAnchor="end">
                {scoreVal}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Area fill under curve */}
        <Polygon points={polygonStr} fill="url(#chartGrad)" />

        {/* The line */}
        <Polyline points={polylineStr} fill="none" stroke={strokeColor} strokeWidth={2.5} />

        {/* Data point dots */}
        {points.map((p, idx) => (
          <React.Fragment key={idx}>
            <Circle cx={p.x} cy={p.y} r={4.5} fill={strokeColor} />
            <Circle cx={p.x} cy={p.y} r={2} fill={colors.bgCard} />
            <SvgText
              x={p.x}
              y={p.y - 7}
              fill={colors.textPrimary}
              fontSize={10}
              fontWeight="700"
              textAnchor="middle">
              {p.score}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
});

export const ProgressScreen = () => {
  const navigation = useNavigation<MainStackNavProp>();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'best'>('all');
  const { data: user } = useUser();
  const { data: progress } = useProgress();
  const { data: history } = useConfidenceHistory(period);
  const { data: speechSessions } = useSpeechSessions();
  const { data: badges } = useBadges();

  const earnedBadges = useMemo(() => (badges ?? []).filter((b) => b.earned), [badges]);

  // Merge speech sessions from progress and query
  const allSpeechSessions = useMemo(() => {
    const listA = speechSessions ?? [];
    const listB = progress?.speechSessions ?? [];
    const raw = listA.length > 0 ? listA : listB;
    if (sessionFilter === 'best') {
      return [...raw].sort((a, b) => b.overallScore - a.overallScore).slice(0, 8);
    }
    return [...raw].sort((a, b) => {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return timeB - timeA;
    }).slice(0, 10);
  }, [speechSessions, progress?.speechSessions, sessionFilter]);

  // Real chart points derived from actual speech sessions & history
  const chartPoints = useMemo(() => {
    const listA = speechSessions ?? [];
    const listB = progress?.speechSessions ?? [];
    const raw = listA.length > 0 ? listA : listB;
    if (raw.length > 0) {
      const sorted = [...raw]
        .sort((a, b) => {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          return timeA - timeB;
        })
        .slice(-(period === 'week' ? 7 : 14));
      return sorted.map((s, idx) => ({
        score: s.overallScore,
        date: s.date ? s.date.split('T')[0] : `Session #${idx + 1}`,
        label: `#${idx + 1}`,
      }));
    }
    if (history && history.length > 0) {
      return history.map((h, idx) => ({
        score: h.score,
        date: h.date,
        label: `#${idx + 1}`,
      }));
    }
    return [];
  }, [speechSessions, progress?.speechSessions, history, period]);

  const monthlyTimeline = useMemo(() => {
    const listA = speechSessions ?? [];
    const listB = progress?.speechSessions ?? [];
    const raw = listA.length > 0 ? listA : listB;
    const groups = new Map<string, { total: number; count: number; best: number }>();
    for (const session of raw) {
      const date = new Date(session.date);
      const key = Number.isNaN(date.getTime())
        ? (session.date ? session.date.slice(0, 7) : 'Recent')
        : date.toLocaleString('default', { month: 'short' });
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
  }, [speechSessions, progress?.speechSessions]);

  const setWeek = useCallback(() => setPeriod('week'), []);
  const setMonth = useCallback(() => setPeriod('month'), []);
  const periodHandlers = useMemo(() => ({ week: setWeek, month: setMonth }), [setWeek, setMonth]);
  const navToBadges = useCallback(() => navigation.navigate('Badges'), [navigation]);
  const navToPractice = useCallback(() => navigation.navigate('Tabs', { screen: 'Practice' }), [navigation]);

  const scoreBadgeColor = (score: number) =>
    score >= 80 ? colors.success : score >= 60 ? colors.xpGold : colors.danger;

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>📊 Your Progress</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>AI-Powered Confidence & Speech Analytics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Confidence Ring */}
        {user && (
          <GlassCard style={styles.ringCard} noPadding glowColor={colors.accentPurple}>
            <View style={styles.ringRow}>
              <ConfidenceRing score={user.confidenceScore} size={130} />
              <View style={styles.ringInfo}>
                <Text style={[styles.ringLevel, { color: colors.textPrimary }]}>{user.levelTitle}</Text>
                <Text style={[styles.ringXP, { color: colors.xpGold }]}>{user.totalXP.toLocaleString()} Total XP 🪙</Text>
                <View style={styles.streakRow}>
                  <Text style={{ fontSize: 18 }}>🔥</Text>
                  <Text style={[styles.streakText, { color: colors.streakOrange }]}>{user.streak} day streak</Text>
                </View>
                <Text style={[styles.totalSpeechesText, { color: colors.accentCyan }]}>
                  🎙️ {user.totalSpeeches} speaking sessions completed
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Real Data Confidence Chart */}
        <GlassCard glowColor={colors.accentCyan}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>REAL SPEECH SCORE HISTORY</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>
                {chartPoints.length > 0
                  ? `Tracking ${chartPoints.length} speech attempts`
                  : 'Start speaking to record live data points'}
              </Text>
            </View>
            <View style={[styles.periodToggle, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
              {(['week', 'month'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && { backgroundColor: colors.accentPurple }]}
                  onPress={periodHandlers[p]}>
                  <Text
                    style={[
                      styles.periodText,
                      { color: colors.textMuted },
                      period === p && { color: colors.white },
                    ]}>
                    {p === 'week' ? 'Recent' : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <EnhancedLineChart
            data={chartPoints}
            strokeColor={colors.accentCyan}
            fillColor={colors.accentPurple}
          />

          <View style={styles.chartLabels}>
            <Text style={[styles.chartLabel, { color: colors.textMuted }]}>
              {chartPoints[0]?.date ? chartPoints[0].date.split('T')[0] : 'First Session'}
            </Text>
            <Text style={[styles.chartLabel, { color: colors.textMuted }]}>
              {chartPoints[chartPoints.length - 1]?.date
                ? chartPoints[chartPoints.length - 1].date.split('T')[0]
                : 'Latest'}
            </Text>
          </View>
        </GlassCard>

        {/* Past Scores of Speaking Sessions */}
        <View style={styles.sessionSection}>
          <View style={styles.sessionHeaderBlock}>
            <View style={styles.sessionTitleWrapper}>
              <Text style={[styles.sessionSectionTitle, { color: colors.textPrimary }]}>
                Speech History & Past Scores
              </Text>
            </View>
            <View style={[styles.sessionFilterToggle, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.sessionFilterBtn,
                  sessionFilter === 'all' && { backgroundColor: colors.accentPurple },
                ]}
                onPress={() => setSessionFilter('all')}>
                <Text
                  style={[
                    styles.sessionFilterBtnText,
                    sessionFilter === 'all' ? { color: colors.white } : { color: colors.textMuted },
                  ]}>
                  Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionFilterBtn,
                  sessionFilter === 'best' && { backgroundColor: colors.accentPurple },
                ]}
                onPress={() => setSessionFilter('best')}>
                <Text
                  style={[
                    styles.sessionFilterBtnText,
                    sessionFilter === 'best' ? { color: colors.white } : { color: colors.textMuted },
                  ]}>
                  🏆 High Scores
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {allSpeechSessions.length > 0 ? (
            <View style={{ gap: Spacing.sm }}>
              {allSpeechSessions.map((session, index) => (
                <SessionScoreCard
                  key={session.id || index}
                  session={session}
                  scoreColor={scoreBadgeColor(session.overallScore)}
                />
              ))}
            </View>
          ) : (
            <GlassCard style={styles.emptySessionCard}>
              <Text style={{ fontSize: 32 }}>🎙️</Text>
              <Text style={[styles.emptySessionTitle, { color: colors.textPrimary }]}>No Speaking Sessions Yet</Text>
              <Text style={[styles.emptySessionSub, { color: colors.textMuted }]}>
                Record your first speech to see AI-graded fluency, pronunciation, pacing, and filler word scores.
              </Text>
              <PrimaryButton
                label="Start 1st Speaking Practice 🎤"
                onPress={navToPractice}
                size="md"
                style={{ marginTop: 8 }}
              />
            </GlassCard>
          )}
        </View>

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

        {/* Statistics Grid */}
        {progress && (
          <View>
            <SectionHeader title="Overall Stats" />
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
              {earnedBadges.slice(0, 8).map((badge) => (
                <GlassCard key={badge.id} style={styles.badgeCard} padding={12}>
                  <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
                  <Text style={[styles.badgeName, { color: colors.textSecondary }]} numberOfLines={2}>
                    {badge.name}
                  </Text>
                </GlassCard>
              ))}
            </ScrollView>
          </View>
        )}

        {monthlyTimeline.length > 0 && (
          <View>
            <SectionHeader title="Monthly Milestones" />
            <GlassCard>
              {monthlyTimeline.map((item, index) => (
                <View key={`${item.month}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineMonthBlock}>
                    <Text style={[styles.timelineMonth, { color: colors.textPrimary }]}>{item.month}</Text>
                    <Text style={[styles.timelineMeta, { color: colors.textMuted }]}>
                      {item.count} session{item.count === 1 ? '' : 's'} (Best: {item.best})
                    </Text>
                  </View>
                  <View style={[styles.timelineBarTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.timelineBarFill,
                        { width: `${item.average}%`, backgroundColor: colors.accentPurpleLight },
                      ]}
                    />
                  </View>
                  <Text style={[styles.timelineScore, { color: colors.accentCyan }]}>{item.average}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* Speech history CTA */}
        <TouchableOpacity onPress={navToPractice} activeOpacity={0.8}>
          <GlassCard style={styles.speechCTA} glowColor={colors.accentPurple}>
            <Text style={{ fontSize: 28 }}>🎙️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>Practice Another Speech</Text>
              <Text style={[styles.ctaSub, { color: colors.textSecondary }]}>
                Boost your confidence score and unlock new badges!
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: colors.accentCyan }}>➡️</Text>
          </GlassCard>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </GradientBackground>
  );
};

const SessionScoreCard = React.memo(({ session, scoreColor }: { session: SpeechSession; scoreColor: string }) => {
  const { colors } = useTheme();
  const dateStr = session.date ? session.date.split('T')[0] : 'Recent';
  const pronunciationScore = (session.components as any)?.pronunciationScore ?? 85;

  return (
    <GlassCard style={styles.sessionCard} padding={14}>
      <View style={styles.sessionCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sessionTopic, { color: colors.textPrimary }]} numberOfLines={1}>
            {session.prompt || 'Speaking Practice Session'}
          </Text>
          <Text style={[styles.sessionDate, { color: colors.textMuted }]}>
            📅 {dateStr} · {session.languageDetected ? `🌐 ${session.languageDetected}` : 'English'}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20`, borderColor: scoreColor }]}>
          <Text style={[styles.scoreBadgeNumber, { color: scoreColor }]}>{session.overallScore}</Text>
          <Text style={[styles.scoreBadgeLabel, { color: scoreColor }]}>SCORE</Text>
        </View>
      </View>

      <View style={styles.sessionMetricsRow}>
        <MetricChip label="Fluency" value={`${session.clarityScore ?? 75}%`} />
        <MetricChip label="Pace" value={`${session.paceWPM || 120} WPM`} />
        <MetricChip label="Pronunciation" value={`${pronunciationScore}%`} />
        <MetricChip label="Fillers" value={String(session.fillerCount ?? 0)} />
        <MetricChip label="XP" value={`+${session.xpEarned || 50}`} isGold />
      </View>
    </GlassCard>
  );
});

const MetricChip = React.memo(({ label, value, isGold }: { label: string; value: string; isGold?: boolean }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.metricChip,
        { backgroundColor: colors.bgInput, borderColor: isGold ? `${colors.xpGold}50` : colors.border },
      ]}>
      <Text style={[styles.metricChipLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricChipValue, { color: isGold ? colors.xpGold : colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { ...(Typography.bodySmall as object) },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.lg, paddingBottom: 80 },
  ringCard: {},
  ringRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
  ringInfo: { flex: 1, gap: 4 },
  ringLevel: { fontSize: 16, fontWeight: '700' },
  ringXP: { ...(Typography.body as object), fontWeight: '700' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { fontSize: 13, fontWeight: '700' },
  totalSpeechesText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { ...(Typography.caption as object), letterSpacing: 1.5 },
  chartSub: { fontSize: 11, marginTop: 2 },
  chartContainer: { width: '100%', alignItems: 'center' },
  periodToggle: { flexDirection: 'row', borderRadius: 8, padding: 3, gap: 3, borderWidth: 1 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  periodText: { fontSize: 11, fontWeight: '600' },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: CHART_PAD_LEFT },
  chartLabel: { fontSize: 10 },
  sessionSection: {},
  sessionHeaderBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
    marginBottom: Spacing.sm,
  },
  sessionTitleWrapper: {
    flexShrink: 1,
  },
  sessionSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sessionFilterToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    gap: 3,
    borderWidth: 1,
  },
  sessionFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  sessionFilterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionCard: { marginBottom: 4 },
  sessionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sessionTopic: { fontSize: 14, fontWeight: '700' },
  sessionDate: { fontSize: 11, marginTop: 2 },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 50,
  },
  scoreBadgeNumber: { fontSize: 16, fontWeight: '900' },
  scoreBadgeLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  sessionMetricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metricChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 54,
  },
  metricChipLabel: { fontSize: 9, fontWeight: '600' },
  metricChipValue: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  emptySessionCard: { alignItems: 'center', gap: 8, paddingVertical: Spacing.xl },
  emptySessionTitle: { fontSize: 16, fontWeight: '700' },
  emptySessionSub: { ...(Typography.bodySmall as object), textAlign: 'center', paddingHorizontal: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeScroll: { gap: Spacing.sm, paddingRight: Spacing.base },
  badgeCard: { width: 80, alignItems: 'center', gap: 6 },
  badgeName: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 12 },
  timelineMonthBlock: { width: 110 },
  timelineMonth: { fontSize: 13, fontWeight: '700' },
  timelineMeta: { fontSize: 10, marginTop: 2 },
  timelineBarTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  timelineBarFill: { height: 8, borderRadius: 4 },
  timelineScore: { width: 30, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  speechCTA: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  ctaTitle: { fontSize: 15, fontWeight: '700' },
  ctaSub: { fontSize: 12, marginTop: 2 },
});
