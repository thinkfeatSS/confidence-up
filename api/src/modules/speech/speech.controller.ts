import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { SpeechService } from './speech.service';
import { CreateSpeechSessionDto } from './dto/create-speech-session.dto';
import { AnalyzeSpeechAiDto } from './dto/analyze-speech-ai.dto';
import { SyncSpeechSessionDto } from './dto/sync-speech-session.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { InternalSecretGuard } from '../../common/guards/internal-secret.guard';

@Controller('speech')
export class SpeechController {
  constructor(private readonly speechService: SpeechService) {}

  @Post('sync-session')
  @Public()
  @UseGuards(InternalSecretGuard)
  syncSession(@Body() dto: SyncSpeechSessionDto) {
    return this.speechService.syncSession(dto);
  }

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
