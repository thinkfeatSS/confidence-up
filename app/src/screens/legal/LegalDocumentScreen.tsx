import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { privacyContent } from '../../content/legal/privacy';
import { termsContent } from '../../content/legal/terms';
import { AuthStackParamList, MainStackParamList } from '../../navigation/types';

type AuthProps = StackScreenProps<AuthStackParamList, 'LegalDocument'>;
type MainProps = StackScreenProps<MainStackParamList, 'LegalDocument'>;
type Props = AuthProps | MainProps;

export const LegalDocumentScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const content = useMemo(
    () => (route.params.document === 'terms' ? termsContent : privacyContent),
    [route.params.document],
  );

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accentCyan }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{content.title}</Text>
        <Text style={[styles.updated, { color: colors.textMuted }]}>Last updated: {content.lastUpdated}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{content.intro}</Text>

        {content.sections.map(section => (
          <GlassCard key={section.id} style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
            {section.summary ? (
              <Text style={[styles.summary, { color: colors.accentCyan }]}>{section.summary}</Text>
            ) : null}
            {section.paragraphs.map((paragraph, index) => (
              <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
                {paragraph}
              </Text>
            ))}
            {section.list?.map((item, index) => (
              <Text key={`list-${index}`} style={[styles.listItem, { color: colors.textSecondary }]}>
                • {item}
              </Text>
            ))}
          </GlassCard>
        ))}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 6 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900' },
  updated: { ...(Typography.caption as object) },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 40 },
  intro: { ...(Typography.body as object), lineHeight: 24 },
  sectionCard: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  summary: { ...(Typography.bodySmall as object), fontWeight: '600' },
  paragraph: { ...(Typography.body as object), lineHeight: 22 },
  listItem: { ...(Typography.body as object), lineHeight: 22, paddingLeft: 4 },
});
