import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionFilterDto } from './dto/mission-filter.dto';
import { SetDailyMissionDto } from './dto/set-daily-mission.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() filter: MissionFilterDto) {
    return this.missionsService.findAll(userId, filter);
  }

  @Get('today')
  findToday(@CurrentUser('id') userId: string) {
    return this.missionsService.findToday(userId);
  }

  @Get('bookmarks')
  findBookmarks(@CurrentUser('id') userId: string) {
    return this.missionsService.findBookmarks(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllAdmin(@Query() filter: MissionFilterDto) {
    return this.missionsService.findAllAdmin(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.missionsService.findOne(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@CurrentUser('id') userId: string, @Param('id') missionId: string) {
    return this.missionsService.complete(userId, missionId);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  toggleBookmark(@CurrentUser('id') userId: string, @Param('id') missionId: string) {
    return this.missionsService.toggleBookmark(userId, missionId);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMissionDto) {
    return this.missionsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Post('daily')
  setDailyMission(@Body() dto: SetDailyMissionDto) {
    return this.missionsService.setDailyMission(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMissionDto) {
    return this.missionsService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.missionsService.remove(id);
  }
}
