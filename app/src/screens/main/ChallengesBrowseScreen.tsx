import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackNavProp } from '../../navigation/types';
import { useChallenges } from '../../hooks/useChallenges';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { CategoryChip } from '../../components/common/CategoryChip';
import { DifficultyBadge } from '../../components/common/DifficultyBadge';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Category, Difficulty, Challenge } from '../../types';

const CATEGORIES: Array<{ id: Category | 'all'; label: string; emoji: string }> = [
  { id: 'all', label: 'All', emoji: '🌟' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'speaking', label: 'Speaking', emoji: '🎤' },
  { id: 'academic', label: 'Academic', emoji: '📚' },
  { id: 'sports', label: 'Sports', emoji: '🏆' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
];

const DIFFICULTIES: Array<{ id: Difficulty | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

// Memoized filter sub-components — stable identity prevents row re-renders
const CategoryTab = React.memo(({ cat, isActive, onPress }: {
  cat: typeof CATEGORIES[0];
  isActive: boolean;
  onPress: (id: Category | 'all') => void;
}) => {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(cat.id), [onPress, cat.id]);
  return (
    <TouchableOpacity
      style={[
        styles.catTab,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        isActive && { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: colors.accentPurple },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Text style={styles.catEmoji}>{cat.emoji}</Text>
      <Text style={[
        styles.catTabText,
        { color: colors.textMuted },
        isActive && { color: colors.accentPurpleLight },
      ]}>{cat.label}</Text>
    </TouchableOpacity>
  );
});

const DiffChip = React.memo(({ diff, isActive, onPress }: {
  diff: typeof DIFFICULTIES[0];
  isActive: boolean;
  onPress: (id: Difficulty | 'all') => void;
}) => {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(diff.id), [onPress, diff.id]);
  return (
    <TouchableOpacity
      style={[
        styles.diffChip,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        isActive && { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: colors.accentPurple },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Text style={[
        styles.diffText,
        { color: colors.textMuted },
        isActive && { color: colors.accentPurpleLight },
      ]}>{diff.label}</Text>
    </TouchableOpacity>
  );
});

// Memoized challenge card to prevent FlatList item re-renders
const ChallengeCard = React.memo(({ item, onPress }: { item: Challenge; onPress: (c: Challenge) => void }) => {
  const { colors } = useTheme();
  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <GlassCard style={[styles.card, item.completed ? styles.cardCompleted : null]}>
        <View style={styles.cardTop}>
          <View style={styles.cardMeta}>
            <CategoryChip category={item.category} />
            <DifficultyBadge difficulty={item.difficulty} />
          </View>
          {item.completed && <Text style={styles.doneText}>✅</Text>}
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.xpText, { color: colors.xpGold }]}>+{item.xpReward} XP 🪙</Text>
          <Text style={[styles.arrowText, { color: colors.accentCyan }]}>View →</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
});

export const ChallengesBrowseScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<MainStackNavProp>();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [activeDiff, setActiveDiff] = useState<Difficulty | 'all'>('all');

  const { data: challenges = [], isLoading } = useChallenges(activeCategory, activeDiff);

  const handleCategoryPress = useCallback((id: Category | 'all') => setActiveCategory(id), []);
  const handleDiffPress = useCallback((id: Difficulty | 'all') => setActiveDiff(id), []);

  const handleChallengePress = useCallback(
    (challenge: Challenge) => navigation.navigate('ChallengeDetail', { challenge }),
    [navigation],
  );

  const renderItem: ListRenderItem<Challenge> = useCallback(
    ({ item }) => <ChallengeCard item={item} onPress={handleChallengePress} />,
    [handleChallengePress],
  );

  const keyExtractor = useCallback((item: Challenge) => item.id, []);

  const listEmpty = useMemo(
    () =>
      isLoading
        ? <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading challenges…</Text>
        : <Text style={[styles.emptyText, { color: colors.textMuted }]}>No challenges found 🔍</Text>,
    [isLoading, colors.textMuted],
  );

  return (
    <GradientBackground style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>⚔️ Challenges</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>{challenges.length} challenges available</Text>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
        style={[styles.categoryScroll, { borderBottomColor: colors.border }]}>
        {CATEGORIES.map(cat => (
          <CategoryTab
            key={cat.id}
            cat={cat}
            isActive={activeCategory === cat.id}
            onPress={handleCategoryPress}
          />
        ))}
      </ScrollView>

      {/* Difficulty filter */}
      <View style={styles.diffRow}>
        {DIFFICULTIES.map(d => (
          <DiffChip
            key={d.id}
            diff={d}
            isActive={activeDiff === d.id}
            onPress={handleDiffPress}
          />
        ))}
      </View>

      {/* Challenge list */}
      <FlatList
        data={challenges}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={8}
        ListEmptyComponent={listEmpty}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { ...(Typography.bodySmall as object) },
  categoryScroll: { height: 60, borderBottomWidth: 1 },
  categoryTabs: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center', paddingVertical: Spacing.xs },
  catEmoji: { fontSize: 14 },
  catTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  catTabText: { fontSize: 12, fontWeight: '600' },
  diffRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  diffChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.sm, borderWidth: 1 },
  diffText: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 80, gap: Spacing.md },
  card: { gap: Spacing.sm },
  cardCompleted: { opacity: 0.65 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { flexDirection: 'row', gap: Spacing.xs },
  doneText: { fontSize: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardDesc: { ...(Typography.bodySmall as object), lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  xpText: { fontSize: 13, fontWeight: '700' },
  arrowText: { fontSize: 13, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40 },
});
