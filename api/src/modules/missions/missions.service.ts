import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionFilterDto } from './dto/mission-filter.dto';
import { SetDailyMissionDto } from './dto/set-daily-mission.dto';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findAll(userId: string, filter: MissionFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filter.category) where.category = filter.category;
    if (filter.difficulty) where.difficulty = filter.difficulty;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search } },
        { description: { contains: filter.search } },
      ];
    }

    const [missions, total] = await Promise.all([
      this.prisma.mission.findMany({
        where,
        skip,
        take: limit,
        include: {
          userMissions: {
            where: { userId },
            select: { isBookmarked: true, completedAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mission.count({ where }),
    ]);

    const data = missions.map((m) => {
      const { userMissions, ...rest } = m;
      return { ...rest, userStatus: userMissions[0] ?? null };
    });

    return { data, total, page, limit };
  }

  async findToday(userId: string) {
    await this.ensureDailyMission();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daily = await this.prisma.dailyMission.findUnique({
      where: { date: today },
      include: {
        mission: {
          include: {
            userMissions: {
              where: { userId },
              select: { isBookmarked: true, completedAt: true },
            },
          },
        },
      },
    });

    if (!daily) return null;

    const { userMissions, ...missionRest } = daily.mission;
    return {
      ...daily,
      mission: { ...missionRest, userStatus: userMissions[0] ?? null },
    };
  }

  async findOne(id: string, userId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: {
        userMissions: {
          where: { userId },
          select: { isBookmarked: true, completedAt: true },
        },
      },
    });
    if (!mission) throw new NotFoundException('Mission not found');

    const { userMissions, ...rest } = mission;
    return { ...rest, userStatus: userMissions[0] ?? null };
  }

  async findBookmarks(userId: string) {
    const bookmarks = await this.prisma.userMission.findMany({
      where: { userId, isBookmarked: true },
      include: { mission: true },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((b) => b.mission);
  }

  async complete(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    const existing = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (existing?.completedAt) return { alreadyCompleted: true, xpEarned: 0 };

    await this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      update: { completedAt: new Date() },
      create: { userId, missionId, completedAt: new Date() },
    });

    await this.gamificationService.awardXp(
      userId,
      mission.xpReward,
      XpSource.MISSION,
      missionId,
    );

    return { xpEarned: mission.xpReward };
  }

  async toggleBookmark(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    const existing = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    const isBookmarked = existing ? !existing.isBookmarked : true;

    await this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      update: { isBookmarked },
      create: { userId, missionId, isBookmarked },
    });

    return { isBookmarked };
  }

  create(dto: CreateMissionDto) {
    return this.prisma.mission.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        difficulty: dto.difficulty,
        xpReward: dto.xpReward ?? 50,
        estimatedMinutes: dto.estimatedMinutes ?? 10,
        tips: dto.tips,
        prompt: dto.prompt,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateMissionDto) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');
    return this.prisma.mission.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');
    return this.prisma.mission.update({ where: { id }, data: { isActive: false } });
  }

  async setDailyMission(dto: SetDailyMissionDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const mission = await this.prisma.mission.findUnique({ where: { id: dto.missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    return this.prisma.dailyMission.upsert({
      where: { date },
      update: { missionId: dto.missionId },
      create: { missionId: dto.missionId, date },
    });
  }

  private startOfDay(input = new Date()) {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /** Pick and persist today's mission if missing. Skips missions used in the last 14 days when possible. */
  async ensureDailyMission(forDate = new Date()) {
    const date = this.startOfDay(forDate);

    const existing = await this.prisma.dailyMission.findUnique({ where: { date } });
    if (existing) return existing;

    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
    });
    if (!missions.length) return null;

    const recent = await this.prisma.dailyMission.findMany({
      where: {
        date: {
          gte: new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000),
          lt: date,
        },
      },
      select: { missionId: true },
    });
    const recentIds = new Set(recent.map((row) => row.missionId));

    let mission = missions.find((m) => !recentIds.has(m.id));
    if (!mission) {
      const dayIndex = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
      mission = missions[dayIndex % missions.length];
    }

    return this.prisma.dailyMission.create({
      data: { missionId: mission.id, date },
    });
  }

  async findAllAdmin(filter: MissionFilterDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.category) where.category = filter.category;
    if (filter.difficulty) where.difficulty = filter.difficulty;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search } },
        { description: { contains: filter.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.mission.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.mission.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
