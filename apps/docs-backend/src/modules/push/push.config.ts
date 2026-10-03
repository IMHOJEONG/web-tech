import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import webPush from 'web-push';

function secret(name: string): string {
  const file = process.env[`${name}_FILE`]?.trim();
  try {
    return (file ? readFileSync(file, 'utf8') : process.env[name] || '').trim();
  } catch {
    throw new Error('Unable to read a configured push secret file.');
  }
}

@Injectable()
export class PushConfig {
  readonly enabled = process.env.PUSH_ENABLED === 'true';
  readonly apiToken = this.enabled ? secret('PUSH_API_TOKEN') : '';
  readonly adminToken = this.enabled ? secret('PUSH_ADMIN_TOKEN') : '';
  readonly publicKey = this.enabled
    ? process.env.PUSH_VAPID_PUBLIC_KEY?.trim() || ''
    : '';
  readonly privateKey = this.enabled ? secret('PUSH_VAPID_PRIVATE_KEY') : '';
  readonly subject = process.env.PUSH_VAPID_SUBJECT?.trim() || '';
  readonly storeFile = resolve(
    process.env.PUSH_STORE_FILE || './data/push-subscriptions.json',
  );

  constructor() {
    if (!this.enabled) return;
    if (
      this.apiToken.length < 32 ||
      this.adminToken.length < 32 ||
      this.apiToken === this.adminToken ||
      !this.publicKey ||
      !this.privateKey
    ) {
      throw new Error('Push configuration is incomplete.');
    }
    // Validate without mutating web-push's process-wide VAPID configuration.
    webPush.generateRequestDetails(
      {
        endpoint: 'https://fcm.googleapis.com/test',
        keys: { p256dh: '', auth: '' },
      },
      undefined,
      {
        vapidDetails: {
          subject: this.subject,
          publicKey: this.publicKey,
          privateKey: this.privateKey,
        },
      },
    );
  }
}
