import { Module } from '@nestjs/common';
import { FearCategoriesService } from './fear-categories.service';
import { FearCategoriesController } from './fear-categories.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [FearCategoriesController],
  providers: [FearCategoriesService],
  exports: [FearCategoriesService],
})
export class FearCategoriesModule {}
