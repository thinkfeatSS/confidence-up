import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource, ReferralStatus } from '@prisma/client';

@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async getMyCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    const referralCode = user?.referralCode ?? '';
    return {
      referralCode,
      shareUrl: `https://speakupmic.vercel.app/join?ref=${referralCode}`,
      shareMessage: `Join me on SpeakUpMic and build your speaking confidence! Use my invite link: https://speakupmic.vercel.app/join?ref=${referralCode}`,
    };
  }

  async apply(userId: string, code: string) {
    const codeOwner = await this.prisma.user.findUnique({ where: { referralCode: code } });
    if (!codeOwner) throw new BadRequestException('Invalid referral code');
    if (codeOwner.id === userId) throw new BadRequestException('Cannot use your own referral code');

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredByCode: true },
    });
    if (currentUser?.referredByCode) {
      throw new BadRequestException('Referral code already applied');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referredByCode: code },
    });

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: codeOwner.id,
        refereeId: userId,
        status: ReferralStatus.PENDING,
      },
    });

    await Promise.all([
      this.gamificationService.awardXp(userId, 50, XpSource.REFERRAL),
      this.gamificationService.awardXp(codeOwner.id, 50, XpSource.REFERRAL),
    ]);

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { status: ReferralStatus.COMPLETED, xpRewardedAt: new Date() },
    });

    return { message: 'Referral applied successfully', xpEarned: 50 };
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.referral.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { id: true, name: true, email: true } },
          referee: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.referral.count(),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
