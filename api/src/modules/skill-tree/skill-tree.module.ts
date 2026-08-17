import { Module } from '@nestjs/common';
import { SkillTreeService } from './skill-tree.service';
import { SkillTreeController } from './skill-tree.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [SkillTreeController],
  providers: [SkillTreeService],
  exports: [SkillTreeService],
})
export class SkillTreeModule {}
