import { IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  subject: string;

  @IsString()
  @MinLength(20)
  body: string;
}
