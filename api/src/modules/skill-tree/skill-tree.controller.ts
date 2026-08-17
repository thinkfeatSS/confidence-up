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
import { SkillTreeService } from './skill-tree.service';
import { CreateSkillNodeDto } from './dto/create-skill-node.dto';
import { UpdateSkillNodeDto } from './dto/update-skill-node.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('skill-tree')
export class SkillTreeController {
  constructor(private readonly skillTreeService: SkillTreeService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.skillTreeService.findAll(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/all')
  findAllAdmin() {
    return this.skillTreeService.findAllAdmin();
  }

  @Post(':nodeId/unlock')
  @HttpCode(HttpStatus.OK)
  unlock(
    @CurrentUser('id') userId: string,
    @CurrentUser('xpTotal') xpTotal: number,
    @Param('nodeId') nodeId: string,
  ) {
    return this.skillTreeService.unlock(userId, nodeId, xpTotal ?? 0);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateSkillNodeDto) {
    return this.skillTreeService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSkillNodeDto) {
    return this.skillTreeService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillTreeService.remove(id);
  }
}
