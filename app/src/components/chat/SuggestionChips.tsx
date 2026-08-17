import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Spacing, BorderRadius } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

const SUGGESTIONS = [
  { id: '1', text: 'I feel nervous' },
  { id: '2', text: 'Help me prepare' },
  { id: '3', text: 'Give me a tip' },
  { id: '4', text: 'I failed today' },
  { id: '5', text: 'How to improve?' },
  { id: '6', text: 'Interview advice' },
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

const SuggestionChip = React.memo(
  ({ text, onSelect, chipStyle, textStyle }: {
    text: string;
    onSelect: (t: string) => void;
    chipStyle: object;
    textStyle: object;
  }) => {
    const handlePress = useCallback(() => onSelect(text), [onSelect, text]);
    return (
      <TouchableOpacity style={[styles.chip, chipStyle]} onPress={handlePress} activeOpacity={0.7}>
        <Text style={[styles.chipText, textStyle]} numberOfLines={1}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  },
);

export const SuggestionChips = React.memo(({ onSelect }: SuggestionChipsProps) => {
  const { colors } = useTheme();
  const chipStyle = {
    backgroundColor: `${colors.accentPurple}18`,
    borderColor: `${colors.accentPurple}40`,
  };
  const textStyle = { color: colors.accentPurpleLight };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={[styles.scroll, { borderTopColor: colors.border, backgroundColor: colors.bgSecondary }]}
      keyboardShouldPersistTaps="handled">
      {SUGGESTIONS.map(s => (
        <SuggestionChip
          key={s.id}
          text={s.text}
          onSelect={onSelect}
          chipStyle={chipStyle}
          textStyle={textStyle}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    borderTopWidth: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minHeight: 52,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
