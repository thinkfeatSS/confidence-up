import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useJournal } from '../../hooks/useJournal';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { Spacing, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

type Props = StackScreenProps<MainStackParamList, 'Journal'>;

const MOOD_EMOJI: Record<number, string> = { 1: '😰', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' };

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const JournalScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { data: entries = [] } = useJournal();

  const moodColor = useMemo(() => ({
    1: colors.danger,
    2: colors.streakOrange,
    3: colors.xpGold,
    4: colors.success,
    5: colors.accentCyan,
  }), [colors]);

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>📔 Journal</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('JournalEntry', {})}
            activeOpacity={0.85}>
            <GlassCard style={styles.newEntryCard} glowColor={colors.accentPurple}>
              <Text style={{ fontSize: 28 }}>✏️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.newEntryTitle, { color: colors.textPrimary }]}>New Entry</Text>
                <Text style={[styles.newEntrySub, { color: colors.textMuted }]}>How are you feeling today?</Text>
              </View>
              <Text style={{ color: colors.accentPurple, fontSize: 20 }}>+</Text>
            </GlassCard>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={[styles.mood, { color: moodColor[item.mood] }]}>
                {MOOD_EMOJI[item.mood]}
              </Text>
              <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(item.date)}</Text>
            </View>
            <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.entryBody, { color: colors.textSecondary }]} numberOfLines={3}>{item.body}</Text>
          </GlassCard>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>No journal entries yet. Write your first! 📝</Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accentPurple, shadowColor: colors.glowPurple }]}
        onPress={() => navigation.navigate('JournalEntry', {})}
        activeOpacity={0.85}>
        <Text style={{ fontSize: 24, color: colors.white }}>✏️</Text>
      </TouchableOpacity>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 100 },
  newEntryCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  newEntryTitle: { fontSize: 15, fontWeight: '700' },
  newEntrySub: { fontSize: 12, marginTop: 2 },
  entryCard: { gap: Spacing.sm },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mood: { fontSize: 22 },
  date: { ...(Typography.caption as object) },
  entryTitle: { fontSize: 16, fontWeight: '700' },
  entryBody: { ...(Typography.bodySmall as object), lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: 40 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});
