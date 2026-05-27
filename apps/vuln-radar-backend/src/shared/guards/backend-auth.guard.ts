import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class BackendAuthGuard implements CanActivate {
  constructor(private readonly appConfigService: AppConfigService) {}

  canActivate(context: ExecutionContext) {
    const expectedToken = this.appConfigService.backendApiToken;

    if (!expectedToken) {
      throw new UnauthorizedException('Unauthorized');
    }

    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const authorizationHeader = request.headers?.authorization;
    const authorizationValue = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    if (!authorizationValue) {
      throw new UnauthorizedException('Unauthorized');
    }

    const [scheme, token] = authorizationValue.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Unauthorized');
    }

    const expectedBuffer = Buffer.from(expectedToken);
    const receivedBuffer = Buffer.from(token);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}
