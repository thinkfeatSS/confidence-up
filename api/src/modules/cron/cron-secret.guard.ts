import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('cron.secret');
    if (!secret) {
      throw new ServiceUnavailableException('CRON_SECRET is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const headerSecret =
      request.headers['x-cron-secret'] ??
      (typeof request.headers.authorization === 'string'
        ? request.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined);

    if (!headerSecret || headerSecret !== secret) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    return true;
  }
}
