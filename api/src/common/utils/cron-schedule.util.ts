import { ConfigService } from '@nestjs/config';

/** In-process @Cron jobs run in dev; production on Hostinger uses hPanel HTTP triggers. */
export function isInternalCronEnabled(configService: ConfigService): boolean {
  return configService.get<boolean>('cron.internalEnabled') === true;
}
