import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityEventType, Prisma } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserTimeline(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.activityTimeline.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityTimeline.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async logEvent(
    userId: string,
    eventType: ActivityEventType,
    eventData: Record<string, unknown>,
  ) {
    return this.prisma.activityTimeline.create({
      data: { userId, eventType, eventData: eventData as Prisma.InputJsonValue },
    });
  }

  async findUserTimelineAdmin(userId: string, page: number, limit: number) {
    return this.findUserTimeline(userId, page, limit);
  }
}
