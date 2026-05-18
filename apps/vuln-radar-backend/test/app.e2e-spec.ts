import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { applyAppBootstrap } from './../src/bootstrap/app-bootstrap';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppBootstrap(app);
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer()).get('/api/health').expect(200).expect({
      status: 'ok',
      service: 'vuln-radar-backend',
      env: 'development',
      frontendOrigin: 'http://localhost:3000',
      storage: 'mock',
    });
  });

  it('/api/overview (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/overview')
      .expect(200);

    expect(response.body.cards.length).toBeGreaterThan(0);
    expect(response.body.cards[0]).toMatchObject({
      id: 'p0-open',
    });
  });

  it('/api/kev (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/kev')
      .expect(200);

    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toMatchObject({
      cveId: 'CVE-2026-10001',
    });
  });
});
