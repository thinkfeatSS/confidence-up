import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class RespondTicketDto {
  @IsString()
  adminResponse: string;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
