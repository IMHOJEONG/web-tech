import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ContentConfigService } from './content-config.service';

describe('ContentConfigService', () => {
  const originalToken = process.env.CONTENT_API_TOKEN;
  const originalTokenFile = process.env.CONTENT_API_TOKEN_FILE;

  afterEach(() => {
    restoreEnvironment('CONTENT_API_TOKEN', originalToken);
    restoreEnvironment('CONTENT_API_TOKEN_FILE', originalTokenFile);
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
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
