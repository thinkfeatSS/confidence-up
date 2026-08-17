import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    return this.prisma.userFeedback.create({
      data: { userId, rating: dto.rating, comment: dto.comment, featureArea: dto.featureArea },
    });
  }

  async findAll(page: number, limit: number, featureArea?: string) {
    const skip = (page - 1) * limit;
    const where = featureArea ? { featureArea } : {};
    const [items, total] = await Promise.all([
      this.prisma.userFeedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.userFeedback.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getAggregate() {
    const [all, averageResult] = await Promise.all([
      this.prisma.userFeedback.findMany({ select: { rating: true } }),
      this.prisma.userFeedback.aggregate({ _avg: { rating: true }, _count: true }),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const { rating } of all) {
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating] = (ratingDistribution[rating] ?? 0) + 1;
      }
    }

    return {
      averageRating: averageResult._avg.rating ?? 0,
      totalCount: averageResult._count,
      ratingDistribution,
    };
  }
}
