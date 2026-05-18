import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: AppConfigService,
          useValue: {
            appEnv: 'test',
            frontendOrigin: 'http://localhost:3000',
            serviceName: 'vuln-radar-backend',
          },
        },
        {
          provide: PrismaService,
          useValue: {
            isReady: false,
          },
        },
      ],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  it('should return backend health status', () => {
    expect(healthController.getStatus()).toEqual({
      status: 'ok',
      service: 'vuln-radar-backend',
      env: 'test',
      frontendOrigin: 'http://localhost:3000',
      storage: 'mock',
    });
  });
});
