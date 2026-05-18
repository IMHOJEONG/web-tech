import { Injectable } from '@nestjs/common';
import { AppConfig, getAppConfig } from './app-config';

@Injectable()
export class AppConfigService {
  private readonly config: AppConfig = getAppConfig();

  get snapshot() {
    return this.config;
  }

  get appEnv() {
    return this.config.appEnv;
  }

  get appPort() {
    return this.config.appPort;
  }

  get corsOrigin() {
    return this.config.corsOrigin;
  }

  get frontendOrigin() {
    return this.config.frontendOrigin;
  }

  get serviceName() {
    return this.config.serviceName;
  }
}
