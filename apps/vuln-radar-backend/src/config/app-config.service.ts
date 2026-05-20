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

  get ingestLookbackHours() {
    return this.config.ingestLookbackHours;
  }

  get ingestSchedulerEnabled() {
    return this.config.ingestSchedulerEnabled;
  }

  get ingestSyncIntervalMinutes() {
    return this.config.ingestSyncIntervalMinutes;
  }

  get ingestSyncOnStartup() {
    return this.config.ingestSyncOnStartup;
  }

  get nvdApiKey() {
    return this.config.nvdApiKey;
  }

  get serviceName() {
    return this.config.serviceName;
  }
}
