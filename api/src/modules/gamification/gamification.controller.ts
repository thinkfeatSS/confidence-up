import { Controller, Get, Post, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CheckinDto } from './dto/checkin.dto';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me/xp')
  getXpSummary(@CurrentUser('id') userId: string) {
    return this.gamificationService.getXpSummary(userId);
  }

  @Get('me/streak')
  getStreak(@CurrentUser('id') userId: string) {
    return this.gamificationService.getStreak(userId);
  }

  @Post('me/checkin')
  dailyCheckin(@CurrentUser('id') userId: string, @Body() _dto: CheckinDto) {
    return this.gamificationService.dailyCheckin(userId);
  }
}
