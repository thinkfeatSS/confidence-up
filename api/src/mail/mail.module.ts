import { Module, Logger } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { MailService } from './mail.service';

function resolveTemplatesDir(): string {
  const candidates = [
    join(__dirname, 'templates'),
    join(__dirname, '..', 'src', 'mail', 'templates'),
    join(__dirname, '..', '..', 'src', 'mail', 'templates'),
    join(process.cwd(), 'dist', 'src', 'mail', 'templates'),
    join(process.cwd(), 'src', 'mail', 'templates'),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  const fallback = join(__dirname, 'templates');
  new Logger('MailModule').warn(
    `No mail templates directory found; tried: ${candidates.join(', ')}. Using ${fallback}`,
  );
  return fallback;
}

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const port = config.get<number>('mail.port') ?? 465;
        const secure = config.get<boolean>('mail.secure') ?? port === 465;
        return {
        transport: {
          host: config.get<string>('mail.host'),
          port,
          secure,
          auth: {
            user: config.get<string>('mail.user'),
            pass: config.get<string>('mail.password'),
          },
          tls: {
            minVersion: 'TLSv1.2',
          },
          ...(port === 587 && !secure ? { requireTLS: true } : {}),
        },
        defaults: {
          from: `"${config.get<string>('mail.fromName')}" <${config.get<string>('mail.fromAddress')}>`,
        },
        template: {
          dir: resolveTemplatesDir(),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
