import {
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import webPush from 'web-push';
import { PushConfig } from './push.config';
import type { StoredPushSubscription } from './push.contract';
import { PushRepository } from './push.repository';

@Injectable()
export class PushService {
  private readonly requests: number[] = [];

  constructor(
    private readonly config: PushConfig,
    private readonly repository: PushRepository,
  ) {}

  private limit(): void {
    const now = Date.now();
    while ((this.requests[0] ?? now) < now - 60_000) this.requests.shift();
    if (this.requests.length >= 30)
      throw new HttpException('Try again later', 429);
    this.requests.push(now);
  }

  async subscribe(subscription: StoredPushSubscription): Promise<void> {
    this.limit();
    await this.repository.update((items) => {
      const existing = items.find(
        (item) => item.endpoint === subscription.endpoint,
      );
      if (existing) {
        if (
          JSON.stringify(existing.keys) !== JSON.stringify(subscription.keys)
        ) {
          throw new HttpException('Invalid subscription', 400);
        }
        return items;
      }
      if (items.length >= 20)
        throw new HttpException('Experiment is full', 429);
      return [...items, subscription];
    });
  }

  async unsubscribe(subscription: StoredPushSubscription): Promise<void> {
    this.limit();
    await this.repository.update((items) =>
      items.filter(
        (item) =>
          item.endpoint !== subscription.endpoint ||
          item.keys.auth !== subscription.keys.auth ||
          item.keys.p256dh !== subscription.keys.p256dh,
      ),
    );
  }

  async sendTest(
    endpoint: string,
  ): Promise<{ sent: boolean; expired?: boolean }> {
    this.limit();
    const subscription = (await this.repository.read()).find(
      (item) => item.endpoint === endpoint,
    );
    if (!subscription) throw new NotFoundException('Not found');
    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'HEAP-FORGE',
          body: '테스트 알림입니다. 새 글 자동 알림은 아직 준비 중입니다.',
          url: '/about',
        }),
        {
          TTL: 60,
          timeout: 5_000,
          vapidDetails: {
            subject: this.config.subject,
            publicKey: this.config.publicKey,
            privateKey: this.config.privateKey,
          },
        },
      );
      return { sent: true };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        (error.statusCode === 404 || error.statusCode === 410)
      ) {
        await this.repository.update((items) =>
          items.filter(
            (item) =>
              item.endpoint !== subscription.endpoint ||
              item.keys.auth !== subscription.keys.auth ||
              item.keys.p256dh !== subscription.keys.p256dh,
          ),
        );
        return { sent: false, expired: true };
      }
      // Never surface provider responses, subscription endpoints or key material.
      throw new ServiceUnavailableException('Delivery unavailable');
    }
  }
}
