import { Controller, Get } from '@nestjs/common';
import { DailyService } from './daily.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('daily')
export class DailyController {
  constructor(private readonly dailyService: DailyService) {}

  @Get('hub')
  getHub(@CurrentUser('id') userId: string) {
    return this.dailyService.getHub(userId);
  }
}
