import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform } from '@prisma/client';
import { CreateAppVersionDto } from './dto/create-app-version.dto';

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const a = parts1[i] ?? 0;
    const b = parts2[i] ?? 0;
    if (a !== b) return a - b;
  }
  return 0;
}

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId, isActive: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');
    if (device.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.device.update({ where: { id: deviceId }, data: { isActive: false } });

    await this.prisma.refreshToken.updateMany({
      where: { deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Device revoked successfully' };
  }

  async checkAppVersion(platform: Platform, version: string) {
    const latest = await this.prisma.appVersion.findFirst({
      where: { platform },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return { isSupported: true, isForceUpdate: false, latestVersion: version, releaseNotes: null };
    }

    const isOutdated = compareVersions(version, latest.version) < 0;
    const isBelowMin = compareVersions(version, latest.minSupportedVersion) < 0;

    return {
      isSupported: !isBelowMin,
      isForceUpdate: latest.isForceUpdate && isBelowMin,
      latestVersion: latest.version,
      releaseNotes: latest.releaseNotes ?? null,
    };
  }

  async findAllVersions() {
    return this.prisma.appVersion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createVersion(dto: CreateAppVersionDto) {
    return this.prisma.appVersion.create({ data: dto });
  }

  async updateVersion(id: string, dto: Partial<CreateAppVersionDto>) {
    const existing = await this.prisma.appVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('App version not found');
    return this.prisma.appVersion.update({ where: { id }, data: dto });
  }

  async deleteVersion(id: string) {
    const existing = await this.prisma.appVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('App version not found');
    return this.prisma.appVersion.delete({ where: { id } });
  }
}
