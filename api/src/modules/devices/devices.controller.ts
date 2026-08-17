import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { AppVersionCheckDto } from './dto/app-version-check.dto';
import { CreateAppVersionDto } from './dto/create-app-version.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  findUserDevices(@CurrentUser('id') userId: string) {
    return this.devicesService.findUserDevices(userId);
  }

  @Delete(':id')
  revokeDevice(@CurrentUser('id') userId: string, @Param('id') deviceId: string) {
    return this.devicesService.revokeDevice(userId, deviceId);
  }

  @Public()
  @Get('app-version')
  checkAppVersion(@Query() dto: AppVersionCheckDto) {
    return this.devicesService.checkAppVersion(dto.platform, dto.version);
  }

  @Roles(Role.ADMIN)
  @Get('admin/versions')
  findAllVersions() {
    return this.devicesService.findAllVersions();
  }

  @Roles(Role.ADMIN)
  @Post('admin/versions')
  createVersion(@Body() dto: CreateAppVersionDto) {
    return this.devicesService.createVersion(dto);
  }

  @Roles(Role.ADMIN)
  @Patch('admin/versions/:id')
  updateVersion(@Param('id') id: string, @Body() dto: Partial<CreateAppVersionDto>) {
    return this.devicesService.updateVersion(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('admin/versions/:id')
  deleteVersion(@Param('id') id: string) {
    return this.devicesService.deleteVersion(id);
  }
}
