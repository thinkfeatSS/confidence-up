import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../common/GlassCard';
import { CategoryChip } from '../common/CategoryChip';
import { DifficultyBadge } from '../common/DifficultyBadge';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { SPEAKING_PRACTICES, SpeakingPracticeItem } from '../../data/speakingPractices';
import { SpeechSession } from '../../types';

interface SpeakingPracticeListModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPractice: (practice: SpeakingPracticeItem) => void;
  activePrompt: string;
  speechSessions?: SpeechSession[];
}

const CATEGORIES = ['All', 'Career', 'Storytelling', 'Debate', 'Leadership', 'Social', 'Academic'] as const;

export const SpeakingPracticeListModal: React.FC<SpeakingPracticeListModalProps> = ({
  visible,
  onClose,
  onSelectPractice,
  activePrompt,
  speechSessions = [],
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute best score map for each practice item
  const bestScoresByPrompt = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const session of speechSessions) {
      if (!session.prompt || session.overallScore === undefined) continue;
      const normalizedPrompt = session.prompt.toLowerCase().trim();
      
      // Match by exact prompt or keywords
      for (const p of SPEAKING_PRACTICES) {
        const itemPromptNorm = p.prompt.toLowerCase().trim();
        const itemTitleNorm = p.title.toLowerCase().trim();
        if (
          normalizedPrompt === itemPromptNorm ||
          normalizedPrompt.includes(itemTitleNorm) ||
          itemPromptNorm.includes(normalizedPrompt)
        ) {
          scores[p.id] = Math.max(scores[p.id] ?? 0, session.overallScore);
        }
      }
    }
    return scores;
  }, [speechSessions]);

  const filteredPractices = useMemo(() => {
    if (selectedCategory === 'All') return SPEAKING_PRACTICES;
    return SPEAKING_PRACTICES.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleSelect = useCallback(
    (item: SpeakingPracticeItem) => {
      onSelectPractice(item);
      onClose();
    },
    [onSelectPractice, onClose],
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.xpGold;
    return colors.danger;
  };

  const renderPracticeItem = ({ item }: { item: SpeakingPracticeItem }) => {
    const bestScore = bestScoresByPrompt[item.id];
    const isSelected =
      activePrompt.toLowerCase().includes(item.title.toLowerCase()) ||
      activePrompt.toLowerCase().trim() === item.prompt.toLowerCase().trim();

    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        activeOpacity={0.85}
        style={styles.itemTouch}>
        <GlassCard
          style={[
            styles.practiceCard,
            isSelected && { borderColor: colors.accentCyan, borderWidth: 1.5 },
          ]}
          glowColor={isSelected ? colors.accentCyan : undefined}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <View style={styles.tagRow}>
                  <View style={[styles.categoryPill, { backgroundColor: colors.bgInput }]}>
                    <Text style={[styles.categoryPillText, { color: colors.accentCyan }]}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={[styles.durationPill, { backgroundColor: colors.bgInput }]}>
                    <Text style={[styles.durationText, { color: colors.textMuted }]}>
                      ⏱️ {item.targetDurationSeconds}s
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.activePill, { backgroundColor: colors.accentPurple }]}>
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Score Badge */}
            <View style={styles.scoreContainer}>
              {bestScore !== undefined ? (
                <View
                  style={[
                    styles.scoreBadge,
                    {
                      borderColor: getScoreColor(bestScore),
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    },
                  ]}>
                  <Text style={styles.trophyIcon}>🏆</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(bestScore) }]}>
                    {bestScore}
                  </Text>
                  <Text style={[styles.scoreOutOf, { color: colors.textMuted }]}>/100</Text>
                </View>
              ) : (
                <View style={[styles.unattemptedBadge, { backgroundColor: colors.bgInput }]}>
                  <Text style={[styles.unattemptedText, { color: colors.textMuted }]}>
                    Not Attempted
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.promptText, { color: colors.textSecondary }]}>{item.prompt}</Text>

          <View style={styles.cardFooter}>
            <Text style={[styles.startPromptText, { color: colors.accentCyan }]}>
              {isSelected ? 'Currently Selected 🎯' : 'Start Speech Practice →'}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.bgCard,
              paddingTop: Spacing.md,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                🎙️ Speaking Practice Library
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                Choose a speech topic & beat your personal best
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            style={styles.filterContainer}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.bgInput, borderColor: colors.border },
                    active && {
                      backgroundColor: colors.accentPurple,
                      borderColor: colors.accentPurpleLight,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textMuted },
                      active && { color: '#FFFFFF', fontWeight: '700' },
                    ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Practices List */}
          <FlatList
            data={filteredPractices}
            keyExtractor={(item) => item.id}
            renderItem={renderPracticeItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '85%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterContainer: {
    maxHeight: 46,
    marginBottom: Spacing.xs,
  },
  filterScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  itemTouch: {
    borderRadius: BorderRadius.lg,
  },
  practiceCard: {
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginTop: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  durationPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activePillText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  trophyIcon: {
    fontSize: 12,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreOutOf: {
    fontSize: 10,
  },
  unattemptedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  unattemptedText: {
    fontSize: 10,
    fontWeight: '500',
  },
  promptText: {
    ...(Typography.bodySmall as object),
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  startPromptText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
