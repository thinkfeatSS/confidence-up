import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillNodeDto } from './dto/create-skill-node.dto';
import { UpdateSkillNodeDto } from './dto/update-skill-node.dto';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class SkillTreeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findAll(userId: string) {
    const [nodes, userUnlocked, user] = await Promise.all([
      this.prisma.skillNode.findMany({
        where: { isActive: true },
        orderBy: [{ branch: 'asc' }, { tier: 'asc' }],
      }),
      this.prisma.userSkillNode.findMany({
        where: { userId },
        select: { skillNodeId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xpTotal: true },
      }),
    ]);

    const userXp = user?.xpTotal ?? 0;
    const unlockedIds = new Set(userUnlocked.map((u) => u.skillNodeId));

    const nodesWithStatus = nodes.map((n) => {
      const isUnlocked = unlockedIds.has(n.id);
      const parentUnlocked = !n.parentNodeId || unlockedIds.has(n.parentNodeId);
      const xpMet = userXp >= n.xpRequired;
      const canUnlock = !isUnlocked && xpMet && parentUnlocked;
      let blockReason: string | null = null;

      if (isUnlocked) {
        blockReason = null;
      } else if (!parentUnlocked) {
        blockReason = 'Unlock the previous skill in this branch first';
      } else if (!xpMet) {
        blockReason = `Need ${n.xpRequired} XP (${userXp} available)`;
      }

      return {
        ...n,
        isUnlocked,
        available: canUnlock,
        canUnlock,
        blockReason,
      };
    });

    const branches: Record<string, typeof nodesWithStatus> = {};
    for (const node of nodesWithStatus) {
      if (!branches[node.branch]) branches[node.branch] = [];
      branches[node.branch].push(node);
    }

    return branches;
  }

  async findUserUnlocked(userId: string): Promise<string[]> {
    const records = await this.prisma.userSkillNode.findMany({
      where: { userId },
      select: { skillNodeId: true },
    });
    return records.map((r) => r.skillNodeId);
  }

  async unlock(
    userId: string,
    skillNodeId: string,
    userXp: number,
  ): Promise<{ success: boolean; message: string }> {
    const node = await this.prisma.skillNode.findUnique({ where: { id: skillNodeId } });
    if (!node) throw new NotFoundException('Skill node not found');

    if (userXp < node.xpRequired) {
      return {
        success: false,
        message: `Not enough XP. Required: ${node.xpRequired}, available: ${userXp}`,
      };
    }

    if (node.parentNodeId) {
      const parentUnlocked = await this.prisma.userSkillNode.findUnique({
        where: { userId_skillNodeId: { userId, skillNodeId: node.parentNodeId } },
      });
      if (!parentUnlocked) {
        return { success: false, message: 'Parent skill node must be unlocked first' };
      }
    }

    const existing = await this.prisma.userSkillNode.findUnique({
      where: { userId_skillNodeId: { userId, skillNodeId } },
    });
    if (existing) {
      return { success: false, message: 'Skill node already unlocked' };
    }

    await this.prisma.userSkillNode.create({ data: { userId, skillNodeId } });
    await this.gamificationService.evaluateUserBadges(userId);
    return { success: true, message: 'Skill node unlocked successfully' };
  }

  create(dto: CreateSkillNodeDto) {
    return this.prisma.skillNode.create({
      data: {
        name: dto.name,
        description: dto.description,
        branch: dto.branch,
        tier: dto.tier ?? 1,
        parentNodeId: dto.parentNodeId ?? null,
        xpRequired: dto.xpRequired ?? 0,
        positionX: dto.positionX,
        positionY: dto.positionY,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateSkillNodeDto) {
    const node = await this.prisma.skillNode.findUnique({ where: { id } });
    if (!node) throw new NotFoundException('Skill node not found');
    return this.prisma.skillNode.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    const node = await this.prisma.skillNode.findUnique({ where: { id } });
    if (!node) throw new NotFoundException('Skill node not found');
    return this.prisma.skillNode.update({ where: { id }, data: { isActive: false } });
  }

  findAllAdmin() {
    return this.prisma.skillNode.findMany({
      orderBy: [{ branch: 'asc' }, { tier: 'asc' }],
    });
  }
}
