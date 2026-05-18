import { INestApplication } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

export function applyAppBootstrap(app: INestApplication) {
  const configService = app.get(AppConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [configService.corsOrigin, configService.frontendOrigin],
  });
}
