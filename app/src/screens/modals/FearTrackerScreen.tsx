import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useFears, useCompleteFearLevel } from '../../hooks/useFears';
import { useAppContext } from '../../context/AppContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { XPGainFloat } from '../../components/gamification/XPGainFloat';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Fear } from '../../types';

type Props = StackScreenProps<MainStackParamList, 'FearTracker'>;

export const FearTrackerScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { data: fears = [] } = useFears();
  const { mutate: completeLevel } = useCompleteFearLevel();
  const { triggerXPGain } = useAppContext();
  const [selectedFear, setSelectedFear] = useState<Fear | null>(null);
  const [showXP, setShowXP] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);

  const handleCompleteLevel = (fear: Fear, level: number, xp: number, fearLevelId?: string) => {
    if (!fearLevelId) return;
    completeLevel({ fearId: fear.id, level, fearLevelId });
    triggerXPGain(xp);
    setXpAmount(xp);
    setShowXP(true);
    setSelectedFear(null);
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>😰 Fear Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Face your fears one level at a time. Small steps lead to big changes.
        </Text>

        <View style={styles.fearGrid}>
          {fears.map(fear => (
            <TouchableOpacity
              key={fear.id}
              onPress={() => setSelectedFear(fear)}
              activeOpacity={0.85}
              style={{ width: '48%' }}>
              <GlassCard style={styles.fearCard} glowColor={fear.color} padding={16}>
                <Text style={{ fontSize: 32 }}>{fear.icon}</Text>
                <Text style={[styles.fearName, { color: colors.textPrimary }]}>{fear.name}</Text>
                <View style={styles.dotsRow}>
                  {fear.levels.map(l => (
                    <View
                      key={l.level}
                      style={[
                        styles.levelDot,
                        {
                          backgroundColor: l.completed
                            ? fear.color
                            : l.level === fear.currentLevel
                              ? fear.color + '60'
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.levelText, { color: fear.color }]}>
                  Level {fear.currentLevel}/{fear.levels.length}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <Modal visible={!!selectedFear} transparent animationType="slide" onRequestClose={() => setSelectedFear(null)}>
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setSelectedFear(null)}
          activeOpacity={1}
        />
        {selectedFear && (
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.bgSecondary,
                borderTopColor: colors.border,
              },
            ]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {selectedFear.icon} {selectedFear.name}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
              {selectedFear.levels.map(level => (
                <View
                  key={level.level}
                  style={[styles.levelRow, { borderBottomColor: colors.border }, level.completed && styles.levelRowDone]}>
                  <View
                    style={[
                      styles.levelBadge,
                      {
                        backgroundColor: level.completed
                          ? colors.success
                          : level.level === selectedFear.currentLevel
                            ? selectedFear.color
                            : colors.border,
                      },
                    ]}>
                    <Text style={[styles.levelBadgeText, { color: colors.white }]}>
                      {level.completed ? '✅' : level.level}
                    </Text>
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>{level.title}</Text>
                    <Text style={[styles.levelDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {level.description}
                    </Text>
                    <Text style={[styles.levelXP, { color: colors.xpGold }]}>+{level.xpReward} XP</Text>
                  </View>
                  {level.level === selectedFear.currentLevel && !level.completed && (
                    <TouchableOpacity
                      style={[styles.completeBtn, { borderColor: selectedFear.color }]}
                      onPress={() =>
                        handleCompleteLevel(selectedFear, level.level, level.xpReward, level.id)
                      }>
                      <Text style={[styles.completeBtnText, { color: selectedFear.color }]}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <PrimaryButton label="Close" onPress={() => setSelectedFear(null)} variant="outline" />
          </View>
        )}
      </Modal>

      {showXP && <XPGainFloat amount={xpAmount} onComplete={() => setShowXP(false)} />}
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
  intro: { ...(Typography.body as object), lineHeight: 24 },
  fearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  fearCard: { alignItems: 'center', gap: Spacing.sm },
  fearName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  levelText: { fontSize: 11, fontWeight: '600' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    paddingBottom: 40,
    maxHeight: '75%',
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetScroll: { maxHeight: 360 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  levelRowDone: { opacity: 0.6 },
  levelBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  levelInfo: { flex: 1, gap: 2 },
  levelTitle: { fontSize: 14, fontWeight: '700' },
  levelDesc: { fontSize: 12 },
  levelXP: { fontSize: 11, fontWeight: '600' },
  completeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  completeBtnText: { fontSize: 12, fontWeight: '700' },
});
