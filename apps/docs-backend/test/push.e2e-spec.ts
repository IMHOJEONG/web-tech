import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import webPush from 'web-push';
import { PushModule } from '../src/modules/push/push.module';
import { PushRepository } from '../src/modules/push/push.repository';
import { PushConfig } from '../src/modules/push/push.config';

const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test',
  keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
};

describe('Push experiment', () => {
  let app: INestApplication;
  let root: string;
  let saved: NodeJS.ProcessEnv;
  const apiToken = 'a'.repeat(64);
  const adminToken = 'b'.repeat(64);

  beforeAll(async () => {
    saved = { ...process.env };
    root = await mkdtemp(join(tmpdir(), 'docs-push-'));
    const keys = webPush.generateVAPIDKeys();
    process.env.PUSH_ENABLED = 'true';
    process.env.PUSH_API_TOKEN = apiToken;
    process.env.PUSH_ADMIN_TOKEN = adminToken;
    process.env.PUSH_VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.PUSH_VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.PUSH_VAPID_SUBJECT = 'mailto:push@example.com';
    process.env.PUSH_STORE_FILE = join(root, 'subscriptions.json');
    delete process.env.PUSH_API_TOKEN_FILE;
    delete process.env.PUSH_ADMIN_TOKEN_FILE;
    delete process.env.PUSH_VAPID_PRIVATE_KEY_FILE;
    const module = await Test.createTestingModule({
      imports: [PushModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await rm(root, { recursive: true, force: true });
    process.env = saved;
  });

  afterEach(() => jest.restoreAllMocks());

  it('protects configuration and subscriptions', async () => {
    await request(app.getHttpServer()).get('/api/push/config').expect(401);
    await request(app.getHttpServer())
      .post('/api/push/subscriptions')
      .send(subscription)
      .expect(401);
    const response = await request(app.getHttpServer())
      .get('/api/push/config')
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(200);
    expect(Object.keys(response.body)).toEqual(['publicKey']);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it.each([
    'http://fcm.googleapis.com/test',
    'https://127.0.0.1/test',
    'https://fcm.googleapis.com.evil.example/test',
    'https://user:password@fcm.googleapis.com/test',
    'https://fcm.googleapis.com:8443/test',
  ])('rejects unsafe push endpoint %s', async (endpoint) => {
    await request(app.getHttpServer())
      .post('/api/push/subscriptions')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({ ...subscription, endpoint })
      .expect(400);
  });

  it('deduplicates concurrent subscriptions and persists across repository instances', async () => {
    await Promise.all(
      Array.from({ length: 3 }, () =>
        request(app.getHttpServer())
          .post('/api/push/subscriptions')
          .set('Authorization', `Bearer ${apiToken}`)
          .send(subscription)
          .expect(200),
      ),
    );
    expect(await app.get(PushRepository).read()).toEqual([subscription]);
    expect(await new PushRepository(app.get(PushConfig)).read()).toEqual([
      subscription,
    ]);
    expect(
      JSON.parse(await readFile(join(root, 'subscriptions.json'), 'utf8')),
    ).toEqual([subscription]);
  });

  it('does not allow the BFF token or content token to send notifications', async () => {
    for (const token of [apiToken, 'content-token']) {
      await request(app.getHttpServer())
        .post('/api/push/test')
        .set('Authorization', `Bearer ${token}`)
        .send({ endpoint: subscription.endpoint })
        .expect(401);
    }
  });

  it('sends only a fixed test notification to a stored endpoint', async () => {
    const send = jest
      .spyOn(webPush, 'sendNotification')
      .mockResolvedValue({ statusCode: 201, body: '', headers: {} });
    await request(app.getHttpServer())
      .post('/api/push/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endpoint: subscription.endpoint })
      .expect(200)
      .expect({ sent: true });
    expect(send).toHaveBeenCalledWith(
      subscription,
      expect.stringContaining('테스트 알림'),
      expect.objectContaining({ timeout: 5000, TTL: 60 }),
    );
    await request(app.getHttpServer())
      .post('/api/push/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endpoint: 'https://fcm.googleapis.com/unknown' })
      .expect(404);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does not remove subscriptions without matching encryption keys', async () => {
    await request(app.getHttpServer())
      .delete('/api/push/subscriptions')
      .set('Authorization', `Bearer ${apiToken}`)
      .send({
        ...subscription,
        keys: { ...subscription.keys, auth: 'C'.repeat(22) },
      })
      .expect(200);
    expect(await app.get(PushRepository).read()).toHaveLength(1);
  });

  it('hides upstream delivery errors without retrying', async () => {
    const send = jest.spyOn(webPush, 'sendNotification').mockRejectedValue(
      Object.assign(new Error('private provider details'), {
        statusCode: 503,
      }),
    );
    const response = await request(app.getHttpServer())
      .post('/api/push/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endpoint: subscription.endpoint })
      .expect(503);
    expect(response.text).not.toContain('private provider details');
    expect(response.text).not.toContain(subscription.endpoint);
    expect(send).toHaveBeenCalledTimes(1);
    expect(await app.get(PushRepository).read()).toHaveLength(1);
  });

  it('removes expired subscriptions and does not retry the send', async () => {
    const send = jest.spyOn(webPush, 'sendNotification').mockRejectedValue(
      Object.assign(new Error('private provider response'), {
        statusCode: 410,
      }),
    );
    await request(app.getHttpServer())
      .post('/api/push/test')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endpoint: subscription.endpoint })
      .expect(200)
      .expect({ sent: false, expired: true });
    expect(await app.get(PushRepository).read()).toEqual([]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('supports idempotent unsubscribe', async () => {
    await request(app.getHttpServer())
      .delete('/api/push/subscriptions')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(subscription)
      .expect(200)
      .expect({ subscribed: false });
  });

  it('caps the experiment at 20 subscriptions', async () => {
    await app.get(PushRepository).update(() =>
      Array.from({ length: 20 }, (_, index) => ({
        ...subscription,
        endpoint: `https://fcm.googleapis.com/test-${index}`,
      })),
    );
    await request(app.getHttpServer())
      .post('/api/push/subscriptions')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(subscription)
      .expect(429);
    expect(await app.get(PushRepository).read()).toHaveLength(20);
  });

  it('is disabled by default even without secrets', async () => {
    process.env.PUSH_ENABLED = 'false';
    process.env.PUSH_API_TOKEN_FILE = '/does-not-exist';
    const module = await Test.createTestingModule({
      imports: [PushModule],
    }).compile();
    const disabled = module.createNestApplication();
    await disabled.init();
    try {
      await request(disabled.getHttpServer())
        .get('/api/push/config')
        .expect(503);
      await request(disabled.getHttpServer())
        .post('/api/push/test')
        .send({ endpoint: subscription.endpoint })
        .expect(503);
    } finally {
      await disabled.close();
    }
  });

  it('limits mutations and recovers after the rolling minute', async () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    let limited = false;
    for (let index = 0; index < 31; index += 1) {
      const response = await request(app.getHttpServer())
        .delete('/api/push/subscriptions')
        .set('Authorization', `Bearer ${apiToken}`)
        .send(subscription);
      if (response.status === 429) {
        limited = true;
        break;
      }
      expect(response.status).toBe(200);
    }
    expect(limited).toBe(true);
    jest.spyOn(Date, 'now').mockReturnValue(now + 60_001);
    await request(app.getHttpServer())
      .delete('/api/push/subscriptions')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(subscription)
      .expect(200);
  });
});
