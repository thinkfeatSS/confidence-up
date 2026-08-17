import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFearCategoryDto } from './dto/create-fear-category.dto';
import { UpdateFearCategoryDto } from './dto/update-fear-category.dto';
import { CreateFearLevelDto } from './dto/create-fear-level.dto';
import { UpdateFearLevelDto } from './dto/update-fear-level.dto';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';

@Injectable()
export class FearCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  findAll() {
    return this.prisma.fearCategory.findMany({
      where: { isActive: true },
      include: {
        fearLevels: { orderBy: { levelNumber: 'asc' } },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.fearCategory.findMany({
      include: {
        fearLevels: { orderBy: { levelNumber: 'asc' } },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.fearCategory.findUnique({
      where: { id },
      include: {
        fearLevels: { orderBy: { levelNumber: 'asc' } },
      },
    });
    if (!category) throw new NotFoundException('Fear category not found');
    return category;
  }

  async findUserProgress(userId: string): Promise<string[]> {
    const records = await this.prisma.userFearProgress.findMany({
      where: { userId },
      select: { fearLevelId: true },
    });
    return records.map((r) => r.fearLevelId);
  }

  async completeLevel(
    userId: string,
    fearLevelId: string,
  ): Promise<{ alreadyCompleted: boolean; xpEarned: number }> {
    const level = await this.prisma.fearLevel.findUnique({
      where: { id: fearLevelId },
    });
    if (!level) throw new NotFoundException('Fear level not found');

    const existing = await this.prisma.userFearProgress.findUnique({
      where: { userId_fearLevelId: { userId, fearLevelId } },
    });

    if (existing) {
      return { alreadyCompleted: true, xpEarned: 0 };
    }

    await this.prisma.userFearProgress.create({ data: { userId, fearLevelId } });
    await this.gamificationService.awardXp(
      userId,
      level.xpReward,
      XpSource.FEAR_LEVEL,
      fearLevelId,
    );

    return { alreadyCompleted: false, xpEarned: level.xpReward };
  }

  create(dto: CreateFearCategoryDto) {
    return this.prisma.fearCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        orderIndex: dto.orderIndex ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async createLevel(categoryId: string, dto: CreateFearLevelDto) {
    await this.findOne(categoryId);
    return this.prisma.fearLevel.create({
      data: {
        categoryId,
        levelNumber: dto.levelNumber,
        title: dto.title,
        description: dto.description,
        xpReward: dto.xpReward ?? 50,
      },
    });
  }

  async update(id: string, dto: UpdateFearCategoryDto) {
    await this.findOne(id);
    return this.prisma.fearCategory.update({ where: { id }, data: dto as any });
  }

  async updateLevel(levelId: string, dto: UpdateFearLevelDto) {
    const level = await this.prisma.fearLevel.findUnique({ where: { id: levelId } });
    if (!level) throw new NotFoundException('Fear level not found');
    return this.prisma.fearLevel.update({ where: { id: levelId }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.fearCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async removeLevel(levelId: string) {
    const level = await this.prisma.fearLevel.findUnique({ where: { id: levelId } });
    if (!level) throw new NotFoundException('Fear level not found');
    return this.prisma.fearLevel.delete({ where: { id: levelId } });
  }
}
