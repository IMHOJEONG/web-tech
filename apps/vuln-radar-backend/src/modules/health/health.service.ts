import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { HealthStatusResponse } from './health.types';

@Injectable()
export class HealthService {
  constructor(private readonly appConfigService: AppConfigService) {}

  getStatus(): HealthStatusResponse {
    return {
      status: 'ok',
      service: this.appConfigService.serviceName,
      env: this.appConfigService.appEnv,
      frontendOrigin: this.appConfigService.frontendOrigin,
    };
  }
}
