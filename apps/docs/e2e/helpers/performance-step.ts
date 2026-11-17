import { test } from '@playwright/test'
import type { Phase } from '../../scripts/e2e-performance'

export function performanceStep<T>(phase: Phase, run: () => Promise<T>) {
    return process.env.DOCS_E2E_TIMING_STEPS === '1'
        ? test.step(`perf:${phase}`, run)
        : run()
}
