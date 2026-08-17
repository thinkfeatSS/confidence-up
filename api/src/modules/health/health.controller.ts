import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  check() {
    const mailUser = this.config.get<string>('mail.user');
    const geminiKey = this.config.get<string>('gemini.apiKey');
    return {
      ok: true,
      mail: mailUser ? { configured: true, user: mailUser } : { configured: false },
      gemini: geminiKey ? { configured: true } : { configured: false },
      nodeEnv: this.config.get<string>('nodeEnv') ?? process.env.NODE_ENV ?? 'unknown',
    };
  }
}
