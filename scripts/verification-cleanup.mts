type CleanupStep =
  | "browserClosed"
  | "backendStopped"
  | "frontendStopped"
  | "databaseDisconnected"
  | "databaseRemoved"
  | "temporaryFilesRemoved";

type CleanupReport = {
  cleanup: Record<CleanupStep, boolean>;
  cleanupErrors: Array<{ step: CleanupStep; message: string }>;
  error?: string;
};

/** Attempts every owned-resource cleanup before reporting, preserving the original failure. */
export async function finishVerification({
  actions,
  redact,
  report,
  fatal,
}: {
  actions: Record<CleanupStep, () => unknown | Promise<unknown>>;
  redact: (value: string) => string;
  report: (result: CleanupReport) => Promise<void>;
  fatal?: string;
}) {
  const cleanup: CleanupReport["cleanup"] = {
    browserClosed: false,
    backendStopped: false,
    frontendStopped: false,
    databaseDisconnected: false,
    databaseRemoved: false,
    temporaryFilesRemoved: false,
  };
  const cleanupErrors: CleanupReport["cleanupErrors"] = [];
  for (const step of Object.keys(cleanup) as CleanupStep[]) {
    try {
      await actions[step]();
      cleanup[step] = true;
    } catch (error) {
      cleanupErrors.push({
        step,
        message: redact(error instanceof Error ? error.message : String(error)),
      });
    }
  }
  const result: CleanupReport = {
    cleanup,
    cleanupErrors,
    ...(fatal !== undefined ? { error: redact(fatal) } : {}),
  };
  let reportError: string | undefined;
  try {
    await report(result);
  } catch (error) {
    reportError = redact(
      error instanceof Error ? error.message : String(error),
    );
  }
  return {
    ...result,
    ...(reportError !== undefined ? { reportError } : {}),
    failed:
      fatal !== undefined ||
      cleanupErrors.length > 0 ||
      reportError !== undefined,
  };
}
