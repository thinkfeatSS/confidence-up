import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, Typography } from '../../theme';
import { aboutContent } from '../../content/about';
import { MainStackParamList } from '../../navigation/types';

type Props = StackScreenProps<MainStackParamList, 'About'>;

export const AboutScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accentCyan }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{aboutContent.hero.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{aboutContent.hero.subtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{aboutContent.story.title}</Text>
          {aboutContent.story.paragraphs.map((paragraph, index) => (
            <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
              {paragraph}
            </Text>
          ))}
        </GlassCard>

        {aboutContent.values.map(value => (
          <GlassCard key={value.title}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{value.title}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{value.description}</Text>
          </GlassCard>
        ))}

        <GlassCard>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{aboutContent.differentiators.title}</Text>
          {aboutContent.differentiators.items.map((item, index) => (
            <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
              • {item}
            </Text>
          ))}
        </GlassCard>

        <GlassCard>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{aboutContent.product.title}</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{aboutContent.product.description}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{aboutContent.company.title}</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{aboutContent.company.description}</Text>
        </GlassCard>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 8 },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '900', lineHeight: 30 },
  subtitle: { ...(Typography.body as object), lineHeight: 24 },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  paragraph: { ...(Typography.body as object), lineHeight: 24, marginBottom: 8 },
  listItem: { ...(Typography.body as object), lineHeight: 24, marginBottom: 6 },
});
