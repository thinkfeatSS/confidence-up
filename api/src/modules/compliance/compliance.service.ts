import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AcceptDocumentDto } from './dto/accept-document.dto';
import { DocumentType } from '@prisma/client';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async accept(userId: string, dto: AcceptDocumentDto, ipAddress: string) {
    return this.prisma.termsAcceptance.create({
      data: {
        userId,
        documentType: dto.documentType,
        version: dto.version,
        ipAddress,
      },
    });
  }

  async findUserAcceptances(userId: string) {
    return this.prisma.termsAcceptance.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  async findAll(page: number, limit: number, documentType?: DocumentType) {
    const skip = (page - 1) * limit;
    const where = documentType ? { documentType } : {};
    const [items, total] = await Promise.all([
      this.prisma.termsAcceptance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { acceptedAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.termsAcceptance.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
