import { Logger } from '@nestjs/common';
import {
  CONTENT_HTML_MAX_BYTES,
  CONTENT_HTML_WARN_BYTES,
} from '@web-tech/docs-content-contract';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

describe('rendered HTML byte budget', () => {
  const service = { getPublishedPost: jest.fn(), renderPost: jest.fn() };
  const controller = new ContentController(
    service as unknown as ContentService,
  );
  const prefix =
    '<!doctype html><html><body><article><pre><code>한글😀 &lt;tag&gt;';
  const suffix = 'tail-marker</code></pre></article></body></html>';
  const baseBytes = Buffer.byteLength(prefix + suffix);
  const htmlAt = (bytes: number) =>
    prefix + 'x'.repeat(bytes - baseBytes) + suffix;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    service.getPublishedPost.mockResolvedValue({ body: 'fixture' });
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    CONTENT_HTML_WARN_BYTES,
    CONTENT_HTML_WARN_BYTES + 1,
    CONTENT_HTML_MAX_BYTES,
  ])(
    'returns all HTML at %i UTF-8 bytes with correct warning threshold',
    async (bytes) => {
      const html = htmlAt(bytes);
      service.renderPost.mockReturnValue(html);
      expect(await controller.getPost('web', 'probe')).toBe(html);
      expect(warn).toHaveBeenCalledTimes(
        bytes > CONTENT_HTML_WARN_BYTES ? 1 : 0,
      );
      expect(error).not.toHaveBeenCalled();
      if (bytes > CONTENT_HTML_WARN_BYTES)
        expect(warn).toHaveBeenCalledWith({
          event: 'content.html_budget_warning',
          bytes,
          limitBytes: CONTENT_HTML_MAX_BYTES,
        });
    },
  );

  it('rejects the whole HTML at one byte over the cap with no path or body in diagnostics', async () => {
    service.renderPost.mockReturnValue(htmlAt(CONTENT_HTML_MAX_BYTES + 1));
    await expect(controller.getPost('web', 'probe')).rejects.toMatchObject({
      status: 503,
    });
    expect(error).toHaveBeenCalledWith({
      event: 'content.html_budget_exceeded',
      bytes: CONTENT_HTML_MAX_BYTES + 1,
      limitBytes: CONTENT_HTML_MAX_BYTES,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps invalid paths as not-found without reading or rendering content', async () => {
    await expect(controller.getPost('web', '..')).rejects.toMatchObject({
      status: 404,
    });
    expect(service.getPublishedPost).not.toHaveBeenCalled();
    expect(service.renderPost).not.toHaveBeenCalled();
  });
});
