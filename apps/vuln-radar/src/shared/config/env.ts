import type { PublicEnv } from "./env.shared";
import { publicEnvSchema } from "./env.shared";

let cachedPublicEnv: PublicEnv | undefined;

export function getPublicEnv() {
  cachedPublicEnv ??= publicEnvSchema.parse(import.meta.env);
  return cachedPublicEnv;
}
