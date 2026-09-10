import { Injectable } from '@nestjs/common';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import { ContentConfigService } from '../../config/content-config.service';
import { CONTENT_CHANNELS } from './content.constants';
import { isValidMarkdownPath } from './content-path';
import type { ContentFile } from './content.types';

@Injectable()
export class ContentRepository {
  constructor(private readonly config: ContentConfigService) {}

  async findAll(): Promise<ContentFile[]> {
    const groups = await Promise.all(
      CONTENT_CHANNELS.map((channel) => this.findInChannel(channel)),
    );

    return groups.flat();
  }

  async findOne(markdownPath: string): Promise<ContentFile | null> {
    if (!isValidMarkdownPath(markdownPath)) {
      return null;
    }

    const filePath = resolve(
      this.config.contentDirectory,
      `${markdownPath}.md`,
    );
    const expectedRoot = `${this.config.contentDirectory}${sep}`;

    if (!filePath.startsWith(expectedRoot)) {
      return null;
    }

    try {
      return {
        markdownPath,
        rawText: await readFile(filePath, 'utf8'),
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }

      throw error;
    }
  }

  private async findInChannel(channel: string): Promise<ContentFile[]> {
    const directory = resolve(this.config.contentDirectory, channel);

    try {
      const entries = await readdir(directory, { withFileTypes: true });
      const markdownFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .sort((left, right) => left.name.localeCompare(right.name));

      return Promise.all(
        markdownFiles.map(async (entry) => ({
          markdownPath: `${channel}/${entry.name.slice(0, -3)}`.replaceAll(
            '\\',
            '/',
          ),
          rawText: await readFile(resolve(directory, entry.name), 'utf8'),
        })),
      );
    } catch (error) {
      if (isMissingFileError(error)) {
        return [];
      }

      throw error;
    }
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
