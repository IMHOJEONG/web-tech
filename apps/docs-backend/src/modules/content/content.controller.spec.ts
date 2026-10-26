import { Logger } from '@nestjs/common';
import {
  CONTENT_POSTS_MAX_BYTES,
  CONTENT_POSTS_WARN_BYTES,
  type CanonicalPublishedPost,
} from '@web-tech/docs-content-contract';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

describe('published index byte budget', () => {
  const service = { getPublishedPosts: jest.fn() };
  const controller = new ContentController(
    service as unknown as ContentService,
  );
  const post: CanonicalPublishedPost = {
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
  const emptyBytes = Buffer.byteLength(
    JSON.stringify({ results: [post] }),
    'utf8',
  );
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    CONTENT_POSTS_WARN_BYTES,
    CONTENT_POSTS_WARN_BYTES + 1,
    CONTENT_POSTS_MAX_BYTES,
  ])(
    'returns the complete UTF-8 payload at %i bytes, warning only above soft budget',
    async (bytes) => {
      const result = {
        ...post,
        searchText: post.searchText + 'x'.repeat(bytes - emptyBytes),
      };
      service.getPublishedPosts.mockResolvedValue([result]);
      const payload = await controller.getPosts();
      expect(Buffer.byteLength(JSON.stringify(payload), 'utf8')).toBe(bytes);
      expect(payload.results).toEqual([result]);
      expect(warn).toHaveBeenCalledTimes(
        bytes > CONTENT_POSTS_WARN_BYTES ? 1 : 0,
      );
      expect(error).not.toHaveBeenCalled();
    },
  );

  it('rejects the entire oversized index with safe numeric diagnostics, never truncates', async () => {
    service.getPublishedPosts.mockResolvedValue([
      {
        ...post,
        searchText:
          post.searchText +
          'x'.repeat(CONTENT_POSTS_MAX_BYTES + 1 - emptyBytes),
      },
    ]);
    await expect(controller.getPosts()).rejects.toMatchObject({ status: 503 });
    expect(error).toHaveBeenCalledWith({
      event: 'content.posts_budget_exceeded',
      bytes: CONTENT_POSTS_MAX_BYTES + 1,
      limitBytes: CONTENT_POSTS_MAX_BYTES,
      count: 1,
    });
    expect(warn).not.toHaveBeenCalled();
  });
});
