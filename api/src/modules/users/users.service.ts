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

    const existing = await this.prisma.accountDeletionRequest.findUnique({
      where: { userId },
    });
    if (existing && !existing.cancelledAt) {
      throw new BadRequestException('Deletion already requested');
    }

    const scheduledDeletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (existing) {
      await this.prisma.accountDeletionRequest.update({
        where: { userId },
        data: {
          reason: dto.reason,
          scheduledDeletionAt,
          cancelledAt: null,
          processedAt: null,
        },
      });
    } else {
      await this.prisma.accountDeletionRequest.create({
        data: { userId, reason: dto.reason, scheduledDeletionAt },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
        deletionScheduledAt: scheduledDeletionAt,
      },
    });

    await this.mailService.sendAccountDeletionWarning(user.email, user.name, scheduledDeletionAt);

    return { message: 'Account deletion scheduled', scheduledDeletionAt };
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
