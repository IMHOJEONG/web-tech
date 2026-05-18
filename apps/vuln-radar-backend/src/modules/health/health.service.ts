import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { HealthStatusResponse } from './health.types';

@Injectable()
export class HealthService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  getStatus(): HealthStatusResponse {
    return {
      status: 'ok',
      service: this.appConfigService.serviceName,
      env: this.appConfigService.appEnv,
      frontendOrigin: this.appConfigService.frontendOrigin,
      storage: this.prismaService.isReady ? 'database' : 'mock',
    };
  }
}
