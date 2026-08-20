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
    const ollamaUrl = this.config.get<string>('ollama.baseUrl');
    const ollamaModel = this.config.get<string>('ollama.model');
    return {
      ok: true,
      mail: mailUser ? { configured: true, user: mailUser } : { configured: false },
      ollama: {
        configured: Boolean(ollamaUrl),
        baseUrl: ollamaUrl,
        model: ollamaModel,
      },
      nodeEnv: this.config.get<string>('nodeEnv') ?? process.env.NODE_ENV ?? 'unknown',
    };
  }
}
