import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import * as express from 'express';
import { ComplianceService } from './compliance.service';
import { AcceptDocumentDto } from './dto/accept-document.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DocumentType, Role } from '@prisma/client';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('accept')
  accept(
    @CurrentUser('id') userId: string,
    @Body() dto: AcceptDocumentDto,
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? null;
    return this.complianceService.accept(userId, dto, ipAddress ?? '');
  }

  @Get('me')
  getMyAcceptances(@CurrentUser('id') userId: string) {
    return this.complianceService.findUserAcceptances(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('documentType') documentType?: DocumentType,
  ) {
    return this.complianceService.findAll(page, limit, documentType);
  }
}
