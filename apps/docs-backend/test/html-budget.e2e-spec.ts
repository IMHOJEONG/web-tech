import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CONTENT_HTML_MAX_BYTES,
  CONTENT_HTML_WARN_BYTES,
} from '@web-tech/docs-content-contract';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/modules/content/content.service';

describe('real Markdown-to-HTML budget over HTTP', () => {
  let app: INestApplication;
  let directory: string;
  const envKeys = [
    'CONTENT_DIR',
    'CONTENT_API_TOKEN',
    'CONTENT_API_TOKEN_FILE',
    'CONTENT_ASSET_BASE_URL',
  ];
  const previous = envKeys.map((key) => [key, process.env[key]] as const);
  const frontmatter = `---
title: HTML budget fixture
slug: probe
summary: Synthetic public content
date: 2026-10-26
updatedAt: 2026-10-26
status: published
authorName: Fixture
authorRole: Tester
readMinutes: 1
topicLabel: WEB
tags: []
---
`;
  const body =
    '## Detail\n\n```html\n' + '<>&'.repeat(20000) + '\n```\n\ntail-marker';
  const get = () =>
    request(app.getHttpServer())
      .get('/posts/web/probe')
      .set('Authorization', 'Bearer html-budget-test-token');

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'html-budget-'));
    await mkdir(join(directory, 'web'));
    await writeFile(join(directory, 'web/probe.md'), frontmatter + body);
    process.env.CONTENT_DIR = directory;
    process.env.CONTENT_API_TOKEN = 'html-budget-test-token';
    delete process.env.CONTENT_API_TOKEN_FILE;
    process.env.CONTENT_ASSET_BASE_URL = 'https://assets.example.test';
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = testingModule.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    if (directory) await rm(directory, { recursive: true, force: true });
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('measures final escaped HTML, accepts its exact cap and rejects one byte more', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn');
    const error = jest.spyOn(Logger.prototype, 'error');
    try {
      const baseline = await get().expect(200);
      const baseBytes = Buffer.byteLength(baseline.text);
      expect(baseBytes).toBeGreaterThan(Buffer.byteLength(body));
      expect(baseline.text).toContain('&lt;&gt;&amp;');
      for (const bytes of [
        CONTENT_HTML_WARN_BYTES,
        CONTENT_HTML_WARN_BYTES + 1,
        CONTENT_HTML_MAX_BYTES,
        CONTENT_HTML_MAX_BYTES + 1,
      ]) {
        await writeFile(
          join(directory, 'web/probe.md'),
          frontmatter + body + 'x'.repeat(bytes - baseBytes),
        );
        const response = await get().expect(
          bytes > CONTENT_HTML_MAX_BYTES ? 503 : 200,
        );
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.headers.vary).toContain('Authorization');
        if (bytes > CONTENT_HTML_MAX_BYTES) {
          expect(response.headers['content-type']).toContain(
            'application/json',
          );
          expect(response.body).toEqual({
            statusCode: 503,
            error: 'Service Unavailable',
            message: 'Content HTML exceeds size budget',
          });
          expect(response.text).not.toMatch(
            /tail-marker|html-budget-test-token|&lt;/,
          );
        } else {
          expect(response.headers['content-type']).toContain('text/html');
          expect(Buffer.byteLength(response.text)).toBe(bytes);
          expect(response.text).toContain('tail-marker');
          expect(response.text.endsWith('</article></body></html>')).toBe(true);
        }
      }
      expect(warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'content.html_budget_warning' }),
      );
      expect(error).toHaveBeenCalledWith({
        event: 'content.html_budget_exceeded',
        bytes: CONTENT_HTML_MAX_BYTES + 1,
        limitBytes: CONTENT_HTML_MAX_BYTES,
      });
      const index = await request(app.getHttpServer())
        .get('/api/posts')
        .set('Authorization', 'Bearer html-budget-test-token')
        .expect(200);
      expect(index.body.results).toHaveLength(1);
      expect(index.body.results[0].markdownPath).toBe('web/probe');
      expect(index.body.results[0].searchText).toContain('tail-marker');
      expect(
        warn.mock.calls.filter(
          ([message]) =>
            typeof message === 'string' &&
            message.includes("Content-Type doesn't match Reply body"),
        ),
      ).toEqual([]);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it('preserves a long valid table rather than truncating its last row', async () => {
    const table =
      '## Table\n\n| Row | Value |\n| --- | --- |\n' +
      Array.from(
        { length: 1000 },
        (_, i) => `| ${i} | 한글 & value-${i} |`,
      ).join('\n');
    await writeFile(join(directory, 'web/probe.md'), frontmatter + table);
    const response = await get().expect(200);
    expect((response.text.match(/<tr>/g) ?? []).length).toBe(1001);
    expect(response.text).toContain('value-999');
  });

  it('checks authentication before reading and preserves real missing-document 404', async () => {
    const service = app.get(ContentService);
    const read = jest.spyOn(service, 'getPublishedPost');
    try {
      await request(app.getHttpServer()).get('/posts/web/probe').expect(401);
      expect(read).not.toHaveBeenCalled();
      await request(app.getHttpServer())
        .get('/posts/web/missing')
        .set('Authorization', 'Bearer html-budget-test-token')
        .expect(404);
    } finally {
      read.mockRestore();
    }
  });
});
