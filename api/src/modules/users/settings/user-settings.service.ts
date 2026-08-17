import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

const DEFAULT_SETTINGS = {
  dailyReminders: false,
  soundEffects: true,
  darkMode: true,
  weeklyReportEmail: false,
};

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const existing = await this.prisma.userSettings.findUnique({ where: { userId } });
    if (existing) return existing;

    return this.prisma.userSettings.create({
      data: { userId, ...DEFAULT_SETTINGS },
    });
  }

  async get(userId: string) {
    return this.getOrCreate(userId);
  }

  async update(userId: string, dto: UpdateUserSettingsDto) {
    await this.getOrCreate(userId);
    return this.prisma.userSettings.update({
      where: { userId },
      data: dto,
    });
  }
}
