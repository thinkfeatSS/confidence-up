import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RespondTicketDto } from './dto/respond-ticket.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, TicketStatus } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.supportService.create(userId, dto);
  }

  @Get('tickets')
  findMyTickets(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.supportService.findUserTickets(userId, page, limit);
  }

  @Get('tickets/:id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.supportService.findOne(id, userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/tickets')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: TicketStatus,
  ) {
    return this.supportService.findAll(page, limit, status);
  }

  @Roles(Role.ADMIN)
  @Get('admin/tickets/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.supportService.findOneAdmin(id);
  }

  @Roles(Role.ADMIN)
  @Patch('admin/tickets/:id')
  respond(
    @Param('id') ticketId: string,
    @Body() dto: RespondTicketDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.supportService.respond(ticketId, dto, adminId);
  }
}
