import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class JournalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  async create(userId: string, dto: CreateJournalEntryDto) {
    const entry = await this.prisma.journalEntry.create({
      data: {
        userId,
        title: dto.title,
        body: dto.body,
        mood: dto.mood,
        reflectionPrompt: dto.reflectionPrompt,
      },
    });

    await this.gamificationService.evaluateUserBadges(userId);
    return entry;
  }

  async update(id: string, userId: string, dto: UpdateJournalEntryDto) {
    await this.findOne(id, userId);
    return this.prisma.journalEntry.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.journalEntry.delete({ where: { id } });
  }
}
