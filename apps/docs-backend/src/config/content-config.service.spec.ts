import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ContentConfigService } from './content-config.service';

describe('ContentConfigService', () => {
  const originalToken = process.env.CONTENT_API_TOKEN;
  const originalTokenFile = process.env.CONTENT_API_TOKEN_FILE;
  const originalPort = process.env.PORT;

  afterEach(() => {
    restoreEnvironment('CONTENT_API_TOKEN', originalToken);
    restoreEnvironment('CONTENT_API_TOKEN_FILE', originalTokenFile);
    restoreEnvironment('PORT', originalPort);
  });

  it('prefers the Docker secret file over the direct environment value', () => {
    const directory = mkdtempSync(join(tmpdir(), 'docs-backend-secret-'));
    const tokenFile = join(directory, 'content_api_token');
    writeFileSync(tokenFile, 'nas-secret\n', 'utf8');
    process.env.CONTENT_API_TOKEN = 'environment-secret';
    process.env.CONTENT_API_TOKEN_FILE = tokenFile;

    try {
      expect(new ContentConfigService().contentApiToken).toBe('nas-secret');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it('uses the direct environment value for local development', () => {
    delete process.env.CONTENT_API_TOKEN_FILE;
    process.env.CONTENT_API_TOKEN = 'local-secret';

    expect(new ContentConfigService().contentApiToken).toBe('local-secret');
  });

  it.each([
    ['1234junk', 8000],
    ['0', 8000],
    ['65536', 8000],
    ['1.5', 8000],
    ['  ', 8000],
    ['65535', 65535],
    [' 3000 ', 3000],
  ])('normalizes PORT=%s to %i', (value, expectedPort) => {
    process.env.PORT = value;

    expect(new ContentConfigService().port).toBe(expectedPort);
  });
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
