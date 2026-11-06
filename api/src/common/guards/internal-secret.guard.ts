import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const internalSecret =
      this.configService.get<string>('cron.secret') ??
      this.configService.get<string>('jwt.secret');

    const request = context.switchToHttp().getRequest();
    const headerSecret =
      request.headers['x-internal-secret'] ??
      request.headers['x-cron-secret'] ??
      (typeof request.headers.authorization === 'string'
        ? request.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined);

    if (!headerSecret || (internalSecret && headerSecret !== internalSecret)) {
      throw new UnauthorizedException('Invalid or missing internal service secret');
    }

    return true;
  }
}

