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
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeFilterDto } from './dto/challenge-filter.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() filter: ChallengeFilterDto) {
    return this.challengesService.findAll(userId, filter);
  }

  @Get('bookmarks')
  findBookmarks(@CurrentUser('id') userId: string) {
    return this.challengesService.findBookmarks(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllAdmin(@Query() filter: ChallengeFilterDto) {
    return this.challengesService.findAllAdmin(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.challengesService.findOne(id, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(@CurrentUser('id') userId: string, @Param('id') challengeId: string) {
    return this.challengesService.start(userId, challengeId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@CurrentUser('id') userId: string, @Param('id') challengeId: string) {
    return this.challengesService.complete(userId, challengeId);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  toggleBookmark(@CurrentUser('id') userId: string, @Param('id') challengeId: string) {
    return this.challengesService.toggleBookmark(userId, challengeId);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateChallengeDto) {
    return this.challengesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.challengesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }
}
