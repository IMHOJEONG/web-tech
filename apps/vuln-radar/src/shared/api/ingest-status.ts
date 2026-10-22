import { z } from "zod";

const observedTime = z.string().datetime({ offset: true }).nullable();
export const ingestObservationSchema = z.object({
  scope: z.literal("process"),
  observedSince: z.string().datetime({ offset: true }),
  outcome: z.enum(["unknown", "running", "completed", "partial", "failed"]),
  lastStartedAt: observedTime,
  lastFinishedAt: observedTime,
  lastSuccessAt: observedTime,
  sources: z.array(
    z.object({
      id: z.enum(["nvd", "kev", "epss"]),
      outcome: z.enum([
        "unknown",
        "not_attempted",
        "running",
        "succeeded",
        "failed",
        "skipped",
      ]),
      lastAttemptAt: observedTime,
      lastFetchSuccessAt: observedTime,
      lastFailureAt: observedTime,
      consecutiveFailures: z.number().int().nonnegative(),
    }),
  ),
});

export const ingestSchedulerSchema = z.object({
  enabled: z.boolean(),
  intervalMinutes: z.number().positive(),
});
