import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeFilterDto } from './dto/challenge-filter.dto';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findAll(userId: string, filter: ChallengeFilterDto) {
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

    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        skip,
        take: limit,
        include: {
          userChallenges: {
            where: { userId },
            select: { startedAt: true, completedAt: true, isBookmarked: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.challenge.count({ where }),
    ]);

    const data = challenges.map((c) => {
      const { userChallenges, ...rest } = c;
      const uc = userChallenges[0] ?? null;
      return {
        ...rest,
        userStatus: uc
          ? {
              started: !!uc.startedAt,
              completed: !!uc.completedAt,
              isBookmarked: uc.isBookmarked,
            }
          : null,
      };
    });

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        userChallenges: {
          where: { userId },
          select: { startedAt: true, completedAt: true, isBookmarked: true },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const { userChallenges, ...rest } = challenge;
    const uc = userChallenges[0] ?? null;
    return {
      ...rest,
      userStatus: uc
        ? {
            started: !!uc.startedAt,
            completed: !!uc.completedAt,
            isBookmarked: uc.isBookmarked,
          }
        : null,
    };
  }

  async findBookmarks(userId: string) {
    const bookmarks = await this.prisma.userChallenge.findMany({
      where: { userId, isBookmarked: true },
      include: { challenge: true },
      orderBy: { startedAt: 'desc' },
    });
    return bookmarks.map((b) => b.challenge);
  }

  async start(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) throw new ConflictException('Challenge already started');

    return this.prisma.userChallenge.create({ data: { userId, challengeId } });
  }

  async complete(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing?.completedAt) return { alreadyCompleted: true, xpEarned: 0 };

    await this.prisma.userChallenge.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: { completedAt: new Date() },
      create: { userId, challengeId, completedAt: new Date() },
    });

    await this.gamificationService.awardXp(
      userId,
      challenge.xpReward,
      XpSource.CHALLENGE,
      challengeId,
    );

    return { xpEarned: challenge.xpReward };
  }

  async toggleBookmark(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    const isBookmarked = existing ? !existing.isBookmarked : true;

    await this.prisma.userChallenge.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: { isBookmarked },
      create: { userId, challengeId, isBookmarked },
    });

    return { isBookmarked };
  }

  create(dto: CreateChallengeDto) {
    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        difficulty: dto.difficulty,
        xpReward: dto.xpReward ?? 100,
        tips: dto.tips,
        durationDays: dto.durationDays ?? 7,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateChallengeDto) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return this.prisma.challenge.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return this.prisma.challenge.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findAllAdmin(filter: ChallengeFilterDto) {
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
      this.prisma.challenge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.challenge.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
