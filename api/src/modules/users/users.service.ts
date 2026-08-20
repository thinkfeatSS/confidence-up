import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { AccountDeletionDto } from './dto/account-deletion.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        _count: {
          select: {
            userBadges: true,
            userMissions: { where: { completedAt: { not: null } } },
            userChallenges: { where: { completedAt: { not: null } } },
            speechSessions: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }

  async update(userId: string, dto: UpdateUserDto) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.preferredLanguages !== undefined) data.preferredLanguages = dto.preferredLanguages;

    const user = await this.prisma.user.update({ where: { id: userId }, data });
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingFears: dto.fears ?? [],
        onboardingGoals: dto.goals ?? [],
        onboardingDailyTime: dto.dailyTime,
        onboardingCompleted: true,
      },
    });
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }

  async requestDeletion(userId: string, dto: AccountDeletionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Send confirmation email before deletion
    try {
      if (user.email) {
        await this.mailService.sendAccountDeletionWarning(user.email, user.name, new Date());
      }
    } catch {
      // Non-blocking email
    }

    // Permanently delete user record - database CASCADE deletes all associated data:
    // speech_sessions, journal_entries, user_badges, user_challenges, user_missions,
    // streaks, daily_checkins, devices, refresh_tokens, settings, and activity_timeline.
    await this.prisma.user.delete({ where: { id: userId } });

    return {
      message: 'Account and all associated personal data have been permanently deleted',
      deletedAt: new Date(),
    };
  }

  async cancelDeletion(userId: string) {
    const request = await this.prisma.accountDeletionRequest.findUnique({
      where: { userId },
    });
    if (!request || request.cancelledAt) {
      throw new BadRequestException('No active deletion request found');
    }

    await Promise.all([
      this.prisma.accountDeletionRequest.update({
        where: { userId },
        data: { cancelledAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: null, deletionScheduledAt: null },
      }),
    ]);

    return { message: 'Account deletion cancelled' };
  }

  async findAllAdmin(page: number, limit: number, search?: string, isBlocked?: boolean) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (isBlocked !== undefined) where.isBlocked = isBlocked;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          blockReason: true,
          xpTotal: true,
          level: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit };
  }

  async findOneAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        streak: true,
        _count: {
          select: {
            userBadges: true,
            userMissions: { where: { completedAt: { not: null } } },
            userChallenges: { where: { completedAt: { not: null } } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }

  async blockUser(id: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBlocked: true, blockReason: reason },
    });
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return safe;
  }

  async unblockUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBlocked: false, blockReason: null },
    });
    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return safe;
  }

  async deleteUserAdmin(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  /** Register or refresh FCM device token for push notifications */
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const platform = (dto.platform as Platform) ?? Platform.ANDROID;

    const existing = await this.prisma.device.findFirst({
      where: { userId, deviceName: dto.deviceName ?? null, isActive: true },
    });

    if (existing) {
      return this.prisma.device.update({
        where: { id: existing.id },
        data: {
          fcmToken: dto.deviceToken,
          appVersion: dto.appVersion,
          platform,
          lastSeenAt: new Date(),
          isActive: true,
        },
      });
    }

    return this.prisma.device.create({
      data: {
        userId,
        fcmToken: dto.deviceToken,
        platform,
        deviceName: dto.deviceName,
        appVersion: dto.appVersion,
      },
    });
  }
}
