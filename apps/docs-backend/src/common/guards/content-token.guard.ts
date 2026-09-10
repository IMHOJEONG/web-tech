import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

import { ContentConfigService } from '../../config/content-config.service';

@Injectable()
export class ContentTokenGuard implements CanActivate {
  private readonly logger = new Logger(ContentTokenGuard.name);

  constructor(private readonly config: ContentConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedToken = this.config.contentApiToken;
    const request = context.switchToHttp().getRequest<Request>();
    const [scheme, suppliedToken = ''] =
      request.headers.authorization?.split(' ', 2) ?? [];

    if (!expectedToken) {
      this.logger.error('Content API authentication is not configured.');
      throw new UnauthorizedException('Unauthorized');
    }

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !suppliedToken ||
      !tokensMatch(suppliedToken, expectedToken)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}

function tokensMatch(suppliedToken: string, expectedToken: string): boolean {
  const supplied = Buffer.from(suppliedToken);
  const expected = Buffer.from(expectedToken);

  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}
