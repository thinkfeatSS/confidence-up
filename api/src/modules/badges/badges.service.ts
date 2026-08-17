import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.badge.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id } });
    if (!badge) throw new NotFoundException('Badge not found');
    return badge;
  }

  findUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  create(dto: CreateBadgeDto) {
    return this.prisma.badge.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        tier: dto.tier,
        category: dto.category,
        criteria: dto.criteria,
        xpReward: dto.xpReward,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBadgeDto) {
    await this.findOne(id);
    return this.prisma.badge.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.badge.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async awardBadgeToUser(userId: string, badgeId: string): Promise<boolean> {
    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (existing) return false;

    await this.prisma.userBadge.create({ data: { userId, badgeId } });
    return true;
  }
}
