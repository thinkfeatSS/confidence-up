import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FearCategoriesService } from './fear-categories.service';
import { CreateFearCategoryDto } from './dto/create-fear-category.dto';
import { UpdateFearCategoryDto } from './dto/update-fear-category.dto';
import { CreateFearLevelDto } from './dto/create-fear-level.dto';
import { UpdateFearLevelDto } from './dto/update-fear-level.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('fears')
export class FearCategoriesController {
  constructor(private readonly fearCategoriesService: FearCategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.fearCategoriesService.findAll();
  }

  @Get('me')
  findMyProgress(@CurrentUser('id') userId: string) {
    return this.fearCategoriesService.findUserProgress(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllAdmin() {
    return this.fearCategoriesService.findAllAdmin();
  }

  @Post('me/:fearLevelId/complete')
  @HttpCode(HttpStatus.OK)
  completeLevel(
    @CurrentUser('id') userId: string,
    @Param('fearLevelId') fearLevelId: string,
  ) {
    return this.fearCategoriesService.completeLevel(userId, fearLevelId);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateFearCategoryDto) {
    return this.fearCategoriesService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Post(':categoryId/levels')
  createLevel(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateFearLevelDto,
  ) {
    return this.fearCategoriesService.createLevel(categoryId, dto);
  }

  @Roles(Role.ADMIN)
  @Patch('levels/:levelId')
  updateLevel(
    @Param('levelId') levelId: string,
    @Body() dto: UpdateFearLevelDto,
  ) {
    return this.fearCategoriesService.updateLevel(levelId, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFearCategoryDto) {
    return this.fearCategoriesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('levels/:levelId')
  removeLevel(@Param('levelId') levelId: string) {
    return this.fearCategoriesService.removeLevel(levelId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fearCategoriesService.remove(id);
  }
}
