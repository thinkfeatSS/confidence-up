import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import {
  hasFirebaseCredentials,
  parseFirebasePrivateKey,
} from '../../common/utils/firebase.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseReady = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase(): void {
    if (getApps().length > 0) {
      this.firebaseReady = true;
      return;
    }

    const projectId = this.config.get<string>('firebase.projectId');
    const clientEmail = this.config.get<string>('firebase.clientEmail');
    const privateKey = parseFirebasePrivateKey(
      this.config.get<string>('firebase.privateKey'),
    );

    if (!hasFirebaseCredentials({ projectId, clientEmail, privateKey })) {
      this.logger.warn('Firebase push disabled — missing or invalid FIREBASE_* credentials');
      return;
    }

    try {
      initializeApp({
        credential: cert({
          projectId: projectId!,
          clientEmail: clientEmail!,
          privateKey: privateKey!,
        }),
      });
      this.firebaseReady = true;
      this.logger.log('Firebase push notifications enabled');
    } catch (error) {
      this.logger.warn(
        `Firebase push disabled — could not parse credentials: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async sendPush(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    referenceId?: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, title, body, type, referenceId },
    });

    if (!this.firebaseReady) return;

    const devices = await this.prisma.device.findMany({
      where: { userId, isActive: true, fcmToken: { not: null } },
    });

    for (const device of devices) {
      if (!device.fcmToken) continue;
      try {
        await getMessaging().send({
          token: device.fcmToken,
          notification: { title, body },
          android: {
            notification: {
              channelId: 'confidenceup_reminders',
            },
          },
        });
      } catch {
        // silently ignore FCM errors
      }
    }
  }

  async sendPushToMany(
    userIds: string[],
    title: string,
    body: string,
    type: NotificationType,
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendPush(userId, title, body, type);
    }
  }

  async getInbox(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async sendStreakReminders(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkedInToday = await this.prisma.dailyCheckin.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const checkedInUserIds = new Set(checkedInToday.map((c) => c.userId));

    const activeStreaks = await this.prisma.streak.findMany({
      where: { currentStreak: { gt: 0 } },
      select: { userId: true },
    });

    const reminderOptIn = await this.prisma.userSettings.findMany({
      where: { dailyReminders: true },
      select: { userId: true },
    });
    const optedIn = new Set(reminderOptIn.map((s) => s.userId));

    const userIds = activeStreaks
      .map((s) => s.userId)
      .filter((uid) => !checkedInUserIds.has(uid) && optedIn.has(uid));

    await this.sendPushToMany(
      userIds,
      'Keep your streak alive! 🔥',
      "Don't forget to check in today to maintain your streak.",
      NotificationType.STREAK_REMINDER,
    );
  }

  async sendMissionReminders(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedToday = await this.prisma.userMission.findMany({
      where: { completedAt: { gte: today, lt: tomorrow } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const completedUserIds = new Set(completedToday.map((m) => m.userId));

    const reminderOptIn = await this.prisma.userSettings.findMany({
      where: { dailyReminders: true },
      select: { userId: true },
    });
    const optedIn = new Set(reminderOptIn.map((s) => s.userId));

    const allUsers = await this.prisma.user.findMany({
      where: { isBlocked: false },
      select: { id: true },
    });

    const userIds = allUsers
      .map((u) => u.id)
      .filter((uid) => !completedUserIds.has(uid) && optedIn.has(uid));

    await this.sendPushToMany(
      userIds,
      'Complete your mission today! 🎯',
      'You have missions waiting for you. Build your confidence!',
      NotificationType.MISSION_REMINDER,
    );
  }
}
