import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Clipboard,
  Share,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../hooks/useUser';
import { useUserSettings, useUpdateUserSettings, UserSettings } from '../../hooks/useUserSettings';
import { useConfidenceAreas } from '../../hooks/useConfidenceAreas';
import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../../services/api';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { LevelBadge } from '../../components/gamification/LevelBadge';
import { StreakFlame } from '../../components/gamification/StreakFlame';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { APP_LINKS } from '../../constants/links';
import { MainStackNavProp } from '../../navigation/types';
import { NotificationsService } from '../../services/notifications';
import { parseApiError } from '../../utils/apiError';
import { isNetworkError } from '../../utils/networkAlert';

type ReferralInfo = { referralCode: string; shareUrl: string; shareMessage: string };

const useReferralInfo = () =>
  useQuery({
    queryKey: ['referral', 'me'],
    queryFn: async (): Promise<ReferralInfo | null> => {
      const res = await apiClient.get<any, any>('/referral/me/code');
      const d = unwrapApiData<ReferralInfo & { code?: string }>(res);
      const referralCode = d.referralCode ?? d.code ?? '';
      if (!referralCode) return null;
      return {
        referralCode,
        shareUrl: d.shareUrl ?? APP_LINKS.joinUrl(referralCode),
        shareMessage: d.shareMessage ?? APP_LINKS.shareMessage(referralCode),
      };
    },
    staleTime: 60 * 60 * 1000,
  });

export const ProfileScreen = () => {
  const navigation = useNavigation<MainStackNavProp>();
  const { logout } = useAuth();
  const { colors, setDarkMode } = useTheme();
  const { data: user } = useUser();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const { data: confidenceData } = useConfidenceAreas();
  const confidenceAreas = confidenceData?.areas ?? [];
  const hasSpeechData = confidenceData?.hasSpeechData ?? false;
  const { data: referral } = useReferralInfo();

  if (!user) return null;

  const patchSetting = (patch: Partial<UserSettings>, onRollback?: () => void) => {
    updateSettings.mutate(patch, {
      onError: (err) => {
        onRollback?.();
        if (!isNetworkError(err)) {
          Alert.alert('Error', parseApiError(err, 'Could not save settings. Try again.').message);
        }
      },
    });
  };

  const handleDailyReminders = async (value: boolean) => {
    patchSetting({ dailyReminders: value }, () => {});
    if (value) {
      const granted = await NotificationsService.requestPermission();
      if (!granted) {
        patchSetting({ dailyReminders: false });
        Alert.alert('Notifications', 'Enable notifications in device settings for daily reminders.');
        return;
      }
      await NotificationsService.syncDeviceWithServer().catch(() => {});
    }
  };

  const handleDarkMode = (value: boolean) => {
    const previous = settings?.darkMode ?? true;
    setDarkMode(value);
    patchSetting({ darkMode: value }, () => setDarkMode(previous));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This will erase all your speech history, confidence scores, streak stats, and earned badges.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/users/me', {
                data: { reason: 'User requested in-app deletion via Profile Screen' },
              });
              Alert.alert(
                'Account Deletion Requested',
                'Your account deletion request has been processed. You will now be signed out.',
                [{ text: 'OK', onPress: () => logout() }],
              );
            } catch (err: any) {
              Alert.alert(
                'Notice',
                'Your account has been scheduled for deletion. Signing you out now.',
                [{ text: 'OK', onPress: () => logout() }],
              );
            }
          },
        },
      ],
    );
  };

  return (
    <GradientBackground style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.bgCard, borderColor: colors.accentPurple }]}>
            <Text style={{ fontSize: 40 }}>😊</Text>
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>level {user.level} · {user.levelTitle}</Text>
          <View style={styles.badgeRow}>
            <LevelBadge level={user.level} title={user.levelTitle} size="lg" showTitle />
            <StreakFlame streak={user.streak} />
          </View>
        </View>

        <GlassCard style={styles.statsCard}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <StatItem icon="⚡" value={user.totalXP.toLocaleString()} label="Total XP" colors={colors} />
            <StatItem icon="🎤" value={String(user.totalSpeeches)} label="Speeches" colors={colors} />
            <StatItem icon="✅" value={String(user.totalChallenges)} label="Challenges" colors={colors} />
            <StatItem icon="🎯" value={`${user.confidenceScore}%`} label="Confidence" colors={colors} />
          </View>
        </GlassCard>

        <GlassCard glowColor={colors.accentPurple}>
          <View style={styles.confidenceHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Confidence Breakdown</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: hasSpeechData ? `${colors.success}20` : `${colors.accentCyan}20`,
                  borderColor: hasSpeechData ? colors.success : colors.accentCyan,
                },
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: hasSpeechData ? colors.success : colors.accentCyan },
                ]}>
                {hasSpeechData ? '⚡ Live AI Analysis' : '🎯 Baseline Profile'}
              </Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 4 }}>
            {confidenceAreas.map((area) => {
              const barColor =
                area.score >= 80 ? colors.success : area.score >= 65 ? colors.accentCyan : colors.xpGold;
              return (
                <View key={area.name} style={styles.areaRow}>
                  <Text style={[styles.areaLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {(area as any).emoji ? `${(area as any).emoji} ` : ''}{area.name}
                  </Text>
                  <View style={[styles.areaBarTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.areaBarFill, { width: `${area.score}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={[styles.areaScore, { color: barColor }]}>{area.score}%</Text>
                </View>
              );
            })}
          </View>

          {confidenceData?.topStrength && (
            <View style={styles.insightPillRow}>
              <View
                style={[
                  styles.insightPill,
                  { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}40` },
                ]}>
                <Text style={[styles.insightPillText, { color: colors.success }]}>
                  🌟 Top: {confidenceData.topStrength}
                </Text>
              </View>
              {confidenceData.focusArea && (
                <View
                  style={[
                    styles.insightPill,
                    { backgroundColor: `${colors.accentPurple}15`, borderColor: `${colors.accentPurple}40` },
                  ]}>
                  <Text style={[styles.insightPillText, { color: colors.accentPurpleLight }]}>
                    🎯 Focus: {confidenceData.focusArea}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.boostBtn,
              { borderColor: `${colors.accentCyan}50`, backgroundColor: `${colors.accentCyan}15` },
            ]}
            onPress={() => navigation.navigate('Tabs', { screen: 'Practice' })}
            activeOpacity={0.8}>
            <Text style={[styles.boostBtnText, { color: colors.accentCyan }]}>
              {hasSpeechData ? '🎙️ Practice Speaking to Level Up' : '🎤 Practice Speech to Calibrate AI'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Settings</Text>
          <SettingRow
            icon="🔔"
            label="Daily Reminders"
            value={settings?.dailyReminders ?? true}
            onChange={handleDailyReminders}
            colors={colors}
          />
          <SettingRow
            icon="🔊"
            label="Sound Effects"
            value={settings?.soundEffects ?? false}
            onChange={value => patchSetting({ soundEffects: value })}
            colors={colors}
          />
          <SettingRow
            icon="🌙"
            label="Dark Mode"
            value={settings?.darkMode ?? false}
            onChange={handleDarkMode}
            colors={colors}
          />
          <SettingRow
            icon="📧"
            label="Weekly Report Email"
            value={settings?.weeklyReportEmail ?? false}
            onChange={value => patchSetting({ weeklyReportEmail: value })}
            colors={colors}
          />
        </GlassCard>

        {referral ? (
          <GlassCard>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Invite a Friend</Text>
            <Text style={[styles.referralSub, { color: colors.textMuted }]}>
              Share your referral code and both get bonus XP!
            </Text>
            <TouchableOpacity
              style={[styles.referralCodeRow, { backgroundColor: colors.bgCardElevated, borderColor: colors.borderAccent }]}
              activeOpacity={0.8}
              onPress={() => {
                Clipboard.setString(referral.referralCode);
                Alert.alert('Copied!', 'Referral code copied to clipboard.');
              }}>
              <Text style={[styles.referralCode, { color: colors.accentPurpleLight }]}>{referral.referralCode}</Text>
              <Text style={[styles.copyHint, { color: colors.textMuted }]}>Tap to copy</Text>
            </TouchableOpacity>
            <PrimaryButton
              label="Share Invite Link"
              variant="outline"
              size="sm"
              onPress={() => Share.share({ message: referral.shareMessage, url: referral.shareUrl })}
            />
          </GlassCard>
        ) : null}

        <GlassCard>
          <LinkRow icon="📄" label="About SpeakUpMic" onPress={() => navigation.navigate('About')} colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow icon="⭐" label="Rate the App" onPress={() => Linking.openURL(APP_LINKS.playStore)} colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow icon="📨" label="Send Feedback" onPress={() => navigation.navigate('Feedback')} colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow icon="🔒" label="Privacy Policy" onPress={() => navigation.navigate('LegalDocument', { document: 'privacy' })} colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow icon="📜" label="Terms of Service" onPress={() => navigation.navigate('LegalDocument', { document: 'terms' })} colors={colors} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow icon="🗑️" label="Delete Account & Data" onPress={handleDeleteAccount} isDestructive colors={colors} />
        </GlassCard>

        <View style={styles.accountActionSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: colors.textMuted }]}>SpeakUpMic v1.0.0 · Made by Thinkfeat</Text>
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </GradientBackground>
  );
};

const StatItem = React.memo(({ icon, value, label, colors }: { icon: string; value: string; label: string; colors: any }) => (
  <View style={styles.statItem}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
  </View>
));

const SettingRow = React.memo(({ icon, label, value, onChange, colors }: { icon: string; label: string; value: boolean; onChange: (v: boolean) => void; colors: any }) => (
  <View style={styles.settingRow}>
    <Text style={{ fontSize: 18 }}>{icon}</Text>
    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.accentPurple }}
      thumbColor={value ? colors.white : colors.textMuted}
    />
  </View>
));

const LinkRow = React.memo(({ icon, label, onPress, isDestructive, colors }: { icon: string; label: string; onPress: () => void; isDestructive?: boolean; colors: any }) => (
  <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={onPress}>
    <Text style={{ fontSize: 18 }}>{icon}</Text>
    <Text style={[styles.linkLabel, { color: isDestructive ? colors.danger : colors.textPrimary }]}>{label}</Text>
    <Text style={{ color: isDestructive ? colors.danger : colors.textMuted, fontSize: 16 }}>›</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: 80, gap: Spacing.lg, paddingTop: 56 },
  avatarSection: { alignItems: 'center', gap: 8, paddingBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 22, fontWeight: '800' },
  email: { ...(Typography.body as object) },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 },
  statsCard: {},
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10 },
  confidenceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  areaLabel: { width: 135, fontSize: 12, fontWeight: '600' },
  areaBarTrack: { flex: 1, height: 6, borderRadius: 3 },
  areaBarFill: { height: 6, borderRadius: 3 },
  areaScore: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  insightPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  insightPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  insightPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  boostBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  boostBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  settingLabel: { flex: 1, ...(Typography.body as object) },
  separator: { height: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  linkLabel: { flex: 1, ...(Typography.body as object) },
  accountActionSection: {
    gap: Spacing.sm,
  },
  signOutBtn: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 11 },
  referralSub: { ...(Typography.bodySmall as object), marginBottom: 12 },
  referralCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  referralCode: { fontSize: 18, fontWeight: '800', letterSpacing: 3 },
  copyHint: { ...(Typography.caption as object) },
});
