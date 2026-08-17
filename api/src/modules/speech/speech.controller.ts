import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SpeechService } from './speech.service';
import { CreateSpeechSessionDto } from './dto/create-speech-session.dto';
import { AnalyzeSpeechAiDto } from './dto/analyze-speech-ai.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Post('sessions')
  createSession(@CurrentUser('id') userId: string, @Body() dto: CreateSpeechSessionDto) {
    return this.speechService.createSession(userId, dto);
  }

  @Post('analyze-ai')
  analyzeWithAi(@CurrentUser('id') userId: string, @Body() dto: AnalyzeSpeechAiDto) {
    return this.speechService.analyzeWithAi(userId, dto);
  }

  @Get('sessions')
  findUserSessions(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.speechService.findUserSessions(userId, page, limit);
  }

  @Get('sessions/:id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.speechService.findOne(id, userId);
  }
}
