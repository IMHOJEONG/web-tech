import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { applyAppBootstrap } from './bootstrap/app-bootstrap';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyAppBootstrap(app);

  const configService = app.get(AppConfigService);
  await app.listen(configService.appPort);
}
bootstrap();
