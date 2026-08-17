import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { AccountDeletionDto } from './dto/account-deletion.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

class BlockUserDto {
  @IsString() reason: string;
}

class AdminUsersQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) page?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) limit?: number;
  @IsOptional() @Transform(({ value }) => value === 'true') isBlocked?: boolean;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  findMe(@CurrentUser('id') userId: string) {
    return this.usersService.findMe(userId);
  }

  @Patch('me')
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @Post('me/device')
  @HttpCode(HttpStatus.OK)
  registerDevice(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceDto) {
    return this.usersService.registerDevice(userId, dto);
  }

  @Post('me/onboarding')
  @HttpCode(HttpStatus.OK)
  completeOnboarding(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardingDto,
  ) {
    return this.usersService.completeOnboarding(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  requestDeletion(
    @CurrentUser('id') userId: string,
    @Body() dto: AccountDeletionDto,
  ) {
    return this.usersService.requestDeletion(userId, dto);
  }

  @Post('me/cancel-deletion')
  @HttpCode(HttpStatus.OK)
  cancelDeletion(@CurrentUser('id') userId: string) {
    return this.usersService.cancelDeletion(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAllAdmin(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAllAdmin(
      query.page ?? 1,
      query.limit ?? 20,
      query.search,
      query.isBlocked,
    );
  }

  @Roles(Role.ADMIN)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.usersService.findOneAdmin(id);
  }

  @Roles(Role.ADMIN)
  @Patch('admin/:id/block')
  blockUser(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.usersService.blockUser(id, dto.reason);
  }

  @Roles(Role.ADMIN)
  @Patch('admin/:id/unblock')
  unblockUser(@Param('id') id: string) {
    return this.usersService.unblockUser(id);
  }

  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  deleteUserAdmin(@Param('id') id: string) {
    return this.usersService.deleteUserAdmin(id);
  }
}
