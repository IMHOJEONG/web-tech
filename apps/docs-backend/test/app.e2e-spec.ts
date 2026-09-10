import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Docs content API', () => {
  let app: INestApplication;
  let temporaryRoot: string;

  beforeAll(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), 'docs-backend-'));
    const contentDirectory = join(temporaryRoot, 'posts');

    await mkdir(join(contentDirectory, 'web'), { recursive: true });
    await mkdir(join(contentDirectory, 'feed'), { recursive: true });
    await writeFile(
      join(contentDirectory, 'web', 'event-loop.md'),
      `---
title: Event Loop
slug: event-loop
summary: Browser runtime ordering
date: 2026-09-08
updatedAt: 2026-09-08
status: published
thumbnail: web/event-loop/thumbnail.webp
authorName: HoJeong Im
authorRole: Web Engineer
readMinutes: 4
topicLabel: WEB
tags:
  - javascript
---
# Event Loop

![runtime](./runtime.webp)

\`\`\`tsx
const run = () => true;
\`\`\`
`,
      'utf8',
    );
    await writeFile(
      join(contentDirectory, 'feed', 'private-note.md'),
      `---
title: Private note
summary: Draft content
date: 2026-09-08
status: draft
---
Not published.
`,
      'utf8',
    );
    await writeFile(
      join(contentDirectory, 'feed', 'archived-note.md'),
      `---
title: Archived note
slug: archived-note
status: archived
---
Not published.
`,
      'utf8',
    );
    await writeFile(
      join(contentDirectory, 'web', 'incomplete.md'),
      `---
title: Incomplete published note
slug: incomplete
summary: Missing canonical metadata
date: 2026-09-08
status: published
---
Not published because metadata is incomplete.
`,
      'utf8',
    );

    delete process.env.CONTENT_API_TOKEN_FILE;
    process.env.CONTENT_API_TOKEN = 'test-content-token';
    process.env.CONTENT_DIR = contentDirectory;
    process.env.CONTENT_ASSET_BASE_URL = 'https://assets.example.com';

    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await rm(temporaryRoot, { force: true, recursive: true });
  });

  it('keeps the health endpoint public', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ service: 'docs-backend', status: 'ok' });
  });

  it('rejects content requests without the shared token', async () => {
    await request(app.getHttpServer()).get('/api/posts').expect(401);
  });

  it('returns only valid published metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/posts')
      .set('Authorization', 'Bearer test-content-token')
      .expect(200);

    expect(response.body.results).toEqual([
      expect.objectContaining({
        id: 'web/event-loop',
        markdownPath: 'web/event-loop',
        authorName: 'HoJeong Im',
        authorRole: 'Web Engineer',
        readMinutes: 4,
        slug: 'event-loop',
        status: 'published',
        thumbnail: 'https://assets.example.com/web/event-loop/thumbnail.webp',
      }),
    ]);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers.vary).toContain('Authorization');
  });

  it('renders baseline HTML while preserving code language metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/posts/web/event-loop')
      .set('Authorization', 'Bearer test-content-token')
      .expect(200)
      .expect('Content-Type', /text\/html/);

    expect(response.text).toContain('<code class="language-tsx">');
    expect(response.text).toContain('=&gt;');
    expect(response.text).toContain(
      'src="https://assets.example.com/web/event-loop/runtime.webp"',
    );
    expect(response.text).not.toContain('shiki');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('does not expose drafts or traversal paths', async () => {
    await request(app.getHttpServer())
      .get('/posts/feed/private-note')
      .set('Authorization', 'Bearer test-content-token')
      .expect(404);
    await request(app.getHttpServer())
      .get('/posts/feed/archived-note')
      .set('Authorization', 'Bearer test-content-token')
      .expect(404);
    await request(app.getHttpServer())
      .get('/posts/web/..%2Fprivate-note')
      .set('Authorization', 'Bearer test-content-token')
      .expect(404);
  });
});
