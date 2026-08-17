import { Controller, Get, Query, DefaultValuePipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me/progress')
  getUserProgress(@CurrentUser('id') userId: string) {
    return this.analyticsService.getUserProgress(userId);
  }

  @Get('me/summary')
  getUserSummary(
    @CurrentUser('id') userId: string,
    @Query('period', new DefaultValuePipe('week')) period: 'week' | 'month',
  ) {
    return this.analyticsService.getUserSummary(userId, period);
  }

  @Get('admin/dashboard')
  @Roles(Role.ADMIN)
  getDashboard() {
    return this.analyticsService.getDashboard();
  }
}
