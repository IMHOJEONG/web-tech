import { Injectable } from '@nestjs/common';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { PushConfig } from './push.config';
import {
  pushSubscriptionSchema,
  type StoredPushSubscription,
} from './push.contract';

const storeSchema = z.array(pushSubscriptionSchema).max(20);

@Injectable()
export class PushRepository {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly config: PushConfig) {}

  async read(): Promise<StoredPushSubscription[]> {
    try {
      return storeSchema.parse(
        JSON.parse(await readFile(this.config.storeFile, 'utf8')),
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      )
        return [];
      throw new Error('Unable to read the push subscription store.');
    }
  }

  update(
    change: (items: StoredPushSubscription[]) => StoredPushSubscription[],
  ): Promise<void> {
    // One NAS process only: serialize mutations and atomically replace the file.
    const operation = this.queue.then(async () => {
      const next = storeSchema.parse(change(await this.read()));
      await mkdir(dirname(this.config.storeFile), {
        recursive: true,
        mode: 0o700,
      });
      const temporary = `${this.config.storeFile}.tmp`;
      await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
      await rename(temporary, this.config.storeFile);
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
}
