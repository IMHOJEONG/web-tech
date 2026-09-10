import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
}

function readContentApiToken(): string {
  const tokenFile = process.env.CONTENT_API_TOKEN_FILE?.trim();

  if (!tokenFile) {
    return process.env.CONTENT_API_TOKEN?.trim() ?? '';
  }

  try {
    return readFileSync(tokenFile, 'utf8').trim();
  } catch {
    throw new Error('Unable to read the configured content API token file.');
  }
}

@Injectable()
export class ContentConfigService {
  readonly port = parsePort(process.env.PORT);
  readonly contentApiToken = readContentApiToken();
  readonly contentDirectory = resolve(
    process.env.CONTENT_DIR?.trim() || resolve(process.cwd(), 'content/posts'),
  );
  readonly assetBaseUrl = (
    process.env.CONTENT_ASSET_BASE_URL?.trim() ?? ''
  ).replace(/\/+$/, '');
}
