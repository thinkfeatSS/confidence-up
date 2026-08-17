import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string | null,
    oldValue: unknown,
    newValue: unknown,
    ipAddress: string | null,
  ) {
    return this.prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        oldValue: oldValue as never,
        newValue: newValue as never,
        ipAddress,
      },
    });
  }

  async findAll(page: number, limit: number, adminId?: string, targetType?: string) {
    const skip = (page - 1) * limit;
    const where: { adminId?: string; targetType?: string } = {};
    if (adminId) where.adminId = adminId;
    if (targetType) where.targetType = targetType;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
