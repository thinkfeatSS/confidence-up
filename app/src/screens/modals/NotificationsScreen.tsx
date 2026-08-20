import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MainStackNavProp } from '../../navigation/types';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  InAppNotification,
} from '../../hooks/useNotifications';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

const getNotificationIcon = (type: InAppNotification['type']) => {
  switch (type) {
    case 'STREAK_REMINDER':
      return '🔥';
    case 'MISSION_REMINDER':
      return '🎯';
    case 'BADGE_EARNED':
      return '🏆';
    case 'LEVEL_UP':
      return '⚡';
    case 'SUPPORT_REPLY':
      return '📨';
    case 'ANNOUNCEMENT':
      return '📢';
    default:
      return '🚀';
  }
};

export const NotificationsScreen = () => {
  const navigation = useNavigation<MainStackNavProp>();
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useNotifications(1, 30);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationPress = useCallback(
    (notification: InAppNotification) => {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }

      // Navigate based on type
      switch (notification.type) {
        case 'STREAK_REMINDER':
        case 'MISSION_REMINDER':
          navigation.navigate('Tabs', { screen: 'Missions' });
          break;
        case 'BADGE_EARNED':
          navigation.navigate('Badges');
          break;
        case 'LEVEL_UP':
          navigation.navigate('Tabs', { screen: 'Progress' });
          break;
        default:
          break;
      }
    },
    [markRead, navigation],
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <GradientBackground style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            style={styles.markAllBtn}
            activeOpacity={0.7}>
            <Text style={[styles.markAllText, { color: colors.accentCyan }]}>Mark Read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accentPurple} />}>
        {notifications.length > 0 ? (
          <View style={{ gap: Spacing.sm }}>
            {notifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.8}>
                  <GlassCard
                    style={[
                      styles.notificationCard,
                      !notification.isRead && {
                        borderColor: `${colors.accentPurple}70`,
                        backgroundColor: `${colors.accentPurple}10`,
                      },
                    ]}
                    padding={14}>
                    <View style={styles.notificationRow}>
                      <View style={[styles.iconBox, { backgroundColor: colors.bgInput }]}>
                        <Text style={{ fontSize: 24 }}>{icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>
                            {notification.title}
                          </Text>
                          {!notification.isRead && (
                            <View style={[styles.unreadDot, { backgroundColor: colors.accentCyan }]} />
                          )}
                        </View>
                        <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                          {notification.body}
                        </Text>
                        <Text style={[styles.notificationDate, { color: colors.textMuted }]}>
                          {formatDate(notification.sentAt)}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Loading notifications…</Text>
          </View>
        ) : (
          <GlassCard style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications Yet</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              You're all caught up! Practice speech sessions or complete daily missions to earn alerts and badges.
            </Text>
            <PrimaryButton
              label="Start Speaking Practice 🎤"
              onPress={() => navigation.navigate('Tabs', { screen: 'Practice' })}
              size="md"
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '800' },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  markAllText: { fontSize: 13, fontWeight: '700' },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 60 },
  notificationCard: {
    borderRadius: BorderRadius.md,
  },
  notificationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  notificationDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySub: {
    ...(Typography.bodySmall as object),
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
