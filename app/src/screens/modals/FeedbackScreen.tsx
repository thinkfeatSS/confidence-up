import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { apiClient } from '../../services/api';
import { MainStackParamList } from '../../navigation/types';

type Props = StackScreenProps<MainStackParamList, 'Feedback'>;

export const FeedbackScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/feedback', { rating, comment: comment.trim() || undefined, featureArea: 'app' });
      Alert.alert('Thank you!', 'Your feedback helps us improve ConfidenceUp.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to send feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accentCyan }]}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Send Feedback</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tell us what is working and what we can improve.</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(value => (
            <Text
              key={value}
              style={styles.star}
              onPress={() => setRating(value)}>
              {value <= rating ? '⭐' : '☆'}
            </Text>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Comments</Text>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bgInput }]}
          placeholder="Share your thoughts..."
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <PrimaryButton label="Submit Feedback" onPress={submit} loading={loading} />
        <PrimaryButton label="Cancel" onPress={() => navigation.goBack()} variant="outline" />
      </GlassCard>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: Spacing.base },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: 15, fontWeight: '600' },
  header: { gap: 8, marginBottom: Spacing.lg },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { ...(Typography.body as object) },
  card: { gap: Spacing.md },
  label: { ...(Typography.labelBold as object) },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  star: { fontSize: 28 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: 12,
    fontSize: 15,
  },
});
