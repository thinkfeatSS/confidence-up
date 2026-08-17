import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UserSettingsService } from './user-settings.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('users/me/settings')
export class UserSettingsController {
  constructor(private readonly settingsService: UserSettingsService) {}

  @Get()
  get(@CurrentUser('id') userId: string) {
    return this.settingsService.get(userId);
  }

  @Patch()
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateUserSettingsDto) {
    return this.settingsService.update(userId, dto);
  }
}
