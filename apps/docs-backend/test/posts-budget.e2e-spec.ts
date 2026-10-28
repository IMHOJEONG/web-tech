import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CONTENT_POSTS_MAX_BYTES } from '@web-tech/docs-content-contract';
import request from 'supertest';
import { ContentConfigService } from '../src/config/content-config.service';
import { ContentController } from '../src/modules/content/content.controller';
import { ContentService } from '../src/modules/content/content.service';

describe('posts byte budget over HTTP', () => {
  let app: INestApplication;
  const service = { getPublishedPosts: jest.fn() };
  const post = {
    id: 'web/probe',
    markdownPath: 'web/probe',
    slug: 'probe',
    title: 'Probe',
    summary: 'Overview',
    date: '2026-10-26',
    updatedAt: '2026-10-26',
    authorName: 'Fixture',
    authorRole: 'Tester',
    readMinutes: 1,
    topicLabel: 'WEB',
    status: 'published',
    tags: [],
    searchText: '한글😀',
  };
  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [
        { provide: ContentService, useValue: service },
        {
          provide: ContentConfigService,
          useValue: { contentApiToken: 'budget-test-token' },
        },
      ],
    }).compile();
    app = testingModule.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('accepts exactly one MiB and returns a non-leaking 503 for one byte more', async () => {
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    const error = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    try {
      const base = Buffer.byteLength(JSON.stringify({ results: [post] }));
      for (const excess of [0, 1]) {
        service.getPublishedPosts.mockResolvedValue([
          {
            ...post,
            searchText:
              post.searchText +
              'x'.repeat(CONTENT_POSTS_MAX_BYTES - base + excess),
          },
        ]);
        const response = await request(app.getHttpServer())
          .get('/api/posts')
          .set('Authorization', 'Bearer budget-test-token')
          .expect(excess ? 503 : 200);
        expect(response.headers['cache-control']).toBe('private, no-store');
        if (excess) {
          expect(response.body).toEqual({
            statusCode: 503,
            error: 'Service Unavailable',
            message: 'Content index exceeds size budget',
          });
          expect(response.text).not.toMatch(
            /searchText|budget-test-token|한글/,
          );
        } else {
          expect(Buffer.byteLength(response.text)).toBe(
            CONTENT_POSTS_MAX_BYTES,
          );
        }
      }
      expect(error).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'content.posts_budget_exceeded' }),
      );
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it('checks authentication before attempting to generate a large list', async () => {
    service.getPublishedPosts.mockClear();
    await request(app.getHttpServer()).get('/api/posts').expect(401);
    expect(service.getPublishedPosts).not.toHaveBeenCalled();
  });
});
