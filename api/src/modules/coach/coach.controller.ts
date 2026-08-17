import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachChatDto } from './dto/coach-chat.dto';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  chat(@Body() dto: CoachChatDto) {
    return this.coachService.chat(dto);
  }
}
