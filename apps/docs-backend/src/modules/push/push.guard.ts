import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { PushConfig } from './push.config';

@Injectable()
export class PushGuard implements CanActivate {
  constructor(
    private readonly config: PushConfig,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.enabled)
      throw new ServiceUnavailableException('Unavailable');
    const request = context.switchToHttp().getRequest<Request>();
    const expected = this.reflector.get<boolean>(
      'push:admin',
      context.getHandler(),
    )
      ? this.config.adminToken
      : this.config.apiToken;
    const supplied = request.headers.authorization || '';
    const actualBytes = Buffer.from(supplied);
    const expectedBytes = Buffer.from(`Bearer ${expected}`);
    if (
      actualBytes.length !== expectedBytes.length ||
      !timingSafeEqual(actualBytes, expectedBytes)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }
}

export const PushAdminOnly = () => SetMetadata('push:admin', true);
