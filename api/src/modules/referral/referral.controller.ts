import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('me/code')
  getMyCode(@CurrentUser('id') userId: string) {
    return this.referralService.getMyCode(userId);
  }

  @Post('apply')
  apply(@CurrentUser('id') userId: string, @Body() dto: ApplyReferralDto) {
    return this.referralService.apply(userId, dto.code);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.referralService.findAll(page, limit);
  }
}
