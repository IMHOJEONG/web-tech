import { z } from 'zod';

export function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    const allowed =
      url.hostname === 'fcm.googleapis.com' ||
      url.hostname === 'updates.push.services.mozilla.com' ||
      url.hostname.endsWith('.push.apple.com');
    return (
      allowed &&
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export const pushSubscriptionSchema = z
  .object({
    endpoint: z.string().max(2048).refine(isAllowedPushEndpoint),
    keys: z
      .object({
        p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}={0,2}$/),
        auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/),
      })
      .strict(),
  })
  .strip();

export type StoredPushSubscription = z.infer<typeof pushSubscriptionSchema>;
