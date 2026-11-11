import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FeedsController } from '../src/modules/feeds/feeds.controller';
import { FeedsService } from '../src/modules/feeds/feeds.service';
import { FeedsRepository } from '../src/modules/feeds/feeds.repository';
import { AppConfigService } from '../src/config/app-config.service';

describe('authenticated Feed search HTTP contract', () => {
  let app: INestApplication;
  const searchFeed = jest.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FeedsController],
      providers: [
        FeedsService,
        { provide: FeedsRepository, useValue: { searchFeed } },
        {
          provide: AppConfigService,
          useValue: { backendApiToken: 'feed-test-token' },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => searchFeed.mockReset());
  it('rejects unauthenticated search before hitting storage', async () => {
    await request(app.getHttpServer())
      .get('/api/feed/search?q=secret')
      .expect(401);
    expect(searchFeed).not.toHaveBeenCalled();
  });
  it.each(['page=0', 'page=1&page=2', 'priority=P9', 'pageSize=101'])(
    'rejects malformed %s',
    async (query) => {
      await request(app.getHttpServer())
        .get('/api/feed/search?' + query)
        .set('Authorization', 'Bearer feed-test-token')
        .expect(400);
      expect(searchFeed).not.toHaveBeenCalled();
    },
  );
  it('passes every validated filter to the repository and preserves empty database results', async () => {
    searchFeed.mockResolvedValue({
      generatedAt: new Date(0).toISOString(),
      items: [],
      dataSource: { kind: 'database' },
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    });
    const response = await request(app.getHttpServer())
      .get('/api/feed/search?q=needle&page=2&priority=P1&severity=high&kev=kev')
      .set('Authorization', 'Bearer feed-test-token')
      .expect(200);
    expect(searchFeed).toHaveBeenCalledWith({
      q: 'needle',
      page: 2,
      pageSize: 25,
      priority: 'P1',
      severity: 'high',
      kev: 'kev',
    });
    expect(response.body.items).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });
});
