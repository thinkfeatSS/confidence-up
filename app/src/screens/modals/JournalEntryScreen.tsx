import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';
import { useAddJournalEntry } from '../../hooks/useJournal';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { reflectionPrompts } from '../../data/mockJournal';
import { MoodLevel } from '../../types';

type Props = StackScreenProps<MainStackParamList, 'JournalEntry'>;

export const JournalEntryScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { mutate: addEntry, isPending } = useAddJournalEntry();
  const [mood, setMood] = useState<MoodLevel>(3);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [promptIdx] = useState(() => Math.floor(Math.random() * reflectionPrompts.length));

  const moods = useMemo(() => [
    { level: 1 as MoodLevel, emoji: '😰', label: 'Terrible', color: colors.danger },
    { level: 2 as MoodLevel, emoji: '😟', label: 'Bad', color: colors.streakOrange },
    { level: 3 as MoodLevel, emoji: '😐', label: 'Okay', color: colors.xpGold },
    { level: 4 as MoodLevel, emoji: '🙂', label: 'Good', color: colors.success },
    { level: 5 as MoodLevel, emoji: '😄', label: 'Great', color: colors.accentCyan },
  ], [colors]);

  const handleSave = () => {
    if (!title.trim() || !body.trim()) return;
    addEntry({ title: title.trim(), body: body.trim(), mood }, {
      onSuccess: () => navigation.goBack(),
      onError: (err: any) => {
        Alert.alert('Could not save', err?.message ?? 'Please try again.');
      },
    });
  };

  const usePrompt = () => {
    setBody(prev => prev ? `${prev}\n\n${reflectionPrompts[promptIdx]}` : reflectionPrompts[promptIdx]);
  };

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Journal Entry</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Mood Selector */}
          <GlassCard>
            <Text style={[styles.moodQuestion, { color: colors.textPrimary }]}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {moods.map(m => (
                <TouchableOpacity
                  key={m.level}
                  style={[styles.moodBtn, mood === m.level && { borderColor: m.color, backgroundColor: m.color + '20' }]}
                  onPress={() => setMood(m.level)}
                  activeOpacity={0.8}>
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: colors.textMuted }, mood === m.level && { color: m.color }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Title */}
          <GlassCard>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
              placeholder="What's on your mind today?"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
          </GlassCard>

          {/* Reflection prompt */}
          <TouchableOpacity onPress={usePrompt} activeOpacity={0.8}>
            <GlassCard style={styles.promptCard} glowColor={colors.accentCyan}>
              <Text style={[styles.promptLabel, { color: colors.accentCyan }]}>💡 REFLECTION PROMPT</Text>
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>{reflectionPrompts[promptIdx]}</Text>
              <Text style={[styles.usePromptText, { color: colors.accentCyan }]}>Tap to use this prompt →</Text>
            </GlassCard>
          </TouchableOpacity>

          {/* Body */}
          <GlassCard>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Your Thoughts</Text>
            <TextInput
              style={[styles.bodyInput, { color: colors.textPrimary }]}
              placeholder="Write freely… this is your safe space."
              placeholderTextColor={colors.textMuted}
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={[styles.charCount, { color: colors.textMuted }]}>{body.length}/2000</Text>
          </GlassCard>

          <PrimaryButton
            label="Save Entry 💾"
            onPress={handleSave}
            loading={isPending}
            disabled={!title.trim() || !body.trim()}
            size="lg"
          />

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 60 },
  moodQuestion: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: { alignItems: 'center', gap: 4, padding: 8, borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: 'transparent' },
  moodLabel: { fontSize: 9, fontWeight: '600' },
  fieldLabel: { ...(Typography.labelBold as object), marginBottom: 8 },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  promptCard: { gap: 6 },
  promptLabel: { ...(Typography.caption as object), letterSpacing: 1.5 },
  promptText: { ...(Typography.body as object), lineHeight: 24 },
  usePromptText: { fontSize: 12 },
  bodyInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 160,
    paddingTop: 4,
  },
  charCount: { alignSelf: 'flex-end', fontSize: 11 },
});
