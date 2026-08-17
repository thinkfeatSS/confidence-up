import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useBadges } from '../../hooks/useBadges';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { Spacing, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { BadgeTier } from '../../types';

type Props = StackScreenProps<MainStackParamList, 'Badges'>;

const TIER_ORDER: BadgeTier[] = ['special', 'advanced', 'growth', 'beginner'];

export const BadgesScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { data: allBadges = [] } = useBadges();

  const tierConfig = useMemo(() => ({
    beginner: { label: 'Beginner', color: colors.success, emoji: '🌱' },
    growth: { label: 'Growth', color: colors.accentCyan, emoji: '📈' },
    advanced: { label: 'Advanced', color: colors.accentPurpleLight, emoji: '⚡' },
    special: { label: 'Special', color: colors.xpGold, emoji: '🌟' },
  }), [colors]);

  const sections = TIER_ORDER.map(tier => ({
    tier,
    title: `${tierConfig[tier].emoji} ${tierConfig[tier].label}`,
    color: tierConfig[tier].color,
    data: [allBadges.filter(b => b.tier === tier)],
  })).filter(s => s.data[0].length > 0);

  const earned = allBadges.filter(b => b.earned).length;

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>🏅 Badges</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          <Text style={[styles.summaryHighlight, { color: colors.xpGold }]}>{earned}</Text>
          /{allBadges.length} earned
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(_item, idx) => String(idx)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
              {section.data[0].filter(b => b.earned).length}/{section.data[0].length}
            </Text>
          </View>
        )}
        renderItem={({ item: badgeGroup, section }) => (
          <View style={styles.badgeGrid}>
            {badgeGroup.map(badge => (
              <GlassCard
                key={badge.id}
                style={[styles.badgeCard, !badge.earned && styles.badgeLocked]}
                padding={14}
                glowColor={badge.isNew ? colors.xpGold : badge.earned ? section.color : undefined}>
                {badge.isNew && (
                  <View style={[styles.newBadge, { backgroundColor: colors.xpGold }]}>
                    <Text style={[styles.newText, { color: colors.bgPrimary }]}>NEW</Text>
                  </View>
                )}
                <Text style={[styles.badgeIcon, !badge.earned && styles.badgeIconLocked]}>{badge.icon}</Text>
                <Text style={[
                  styles.badgeName,
                  { color: colors.textPrimary },
                  !badge.earned && { color: colors.textMuted },
                ]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textMuted }]} numberOfLines={2}>{badge.description}</Text>
                {badge.earned && badge.earnedAt && (
                  <Text style={[styles.earnedDate, { color: section.color }]}>
                    ✅ {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </GlassCard>
            ))}
          </View>
        )}
        ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  summary: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  summaryText: { ...(Typography.body as object) },
  summaryHighlight: { fontWeight: '800', fontSize: 18 },
  listContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: 60 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  sectionCount: { ...(Typography.caption as object) },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: { width: '30%', alignItems: 'center', gap: 6, position: 'relative' },
  badgeLocked: { opacity: 0.45 },
  badgeIcon: { fontSize: 28 },
  badgeIconLocked: { opacity: 0.5 },
  badgeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  badgeDesc: { fontSize: 9, textAlign: 'center', lineHeight: 14 },
  earnedDate: { fontSize: 9, fontWeight: '600' },
  newBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newText: { fontSize: 8, fontWeight: '800' },
});
