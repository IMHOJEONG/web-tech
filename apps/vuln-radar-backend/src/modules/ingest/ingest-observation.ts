import type { IngestSourceId } from './ingest.types';

type SourceOutcome =
  | 'unknown'
  | 'not_attempted'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export interface IngestSourceObservation {
  id: IngestSourceId;
  outcome: SourceOutcome;
  lastAttemptAt: string | null;
  lastFetchSuccessAt: string | null;
  lastFailureAt: string | null;
  consecutiveFailures: number;
}

export interface IngestObservationSnapshot {
  scope: 'process';
  observedSince: string;
  outcome: 'unknown' | 'running' | 'completed' | 'partial' | 'failed';
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastSuccessAt: string | null;
  sources: IngestSourceObservation[];
}

// A source fetch and a completed database application are different observations.
export class IngestObservation {
  private state: IngestObservationSnapshot;

  constructor(
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.state = {
      scope: 'process',
      observedSince: now(),
      outcome: 'unknown',
      lastStartedAt: null,
      lastFinishedAt: null,
      lastSuccessAt: null,
      sources: (['nvd', 'kev', 'epss'] as const).map((id) => ({
        id,
        outcome: 'unknown',
        lastAttemptAt: null,
        lastFetchSuccessAt: null,
        lastFailureAt: null,
        consecutiveFailures: 0,
      })),
    };
  }

  get running() {
    return this.state.outcome === 'running';
  }

  snapshot(): IngestObservationSnapshot {
    return {
      ...this.state,
      sources: this.state.sources.map((source) => ({ ...source })),
    };
  }

  start() {
    this.state.outcome = 'running';
    this.state.lastStartedAt = this.now();
    this.state.sources.forEach((source) => {
      source.outcome = 'not_attempted';
    });
  }

  sourceStarted(id: IngestSourceId) {
    const source = this.source(id);
    source.outcome = 'running';
    source.lastAttemptAt = this.now();
  }

  sourceSucceeded(id: IngestSourceId) {
    const source = this.source(id);
    source.outcome = 'succeeded';
    source.lastFetchSuccessAt = this.now();
    source.consecutiveFailures = 0;
  }

  sourceFailed(id: IngestSourceId) {
    const source = this.source(id);
    source.outcome = 'failed';
    source.lastFailureAt = this.now();
    source.consecutiveFailures += 1;
  }

  sourceSkipped(id: IngestSourceId) {
    this.source(id).outcome = 'skipped';
  }

  finish(outcome: 'completed' | 'partial' | 'failed') {
    this.state.outcome = outcome;
    this.state.lastFinishedAt = this.now();
    if (outcome === 'completed')
      this.state.lastSuccessAt = this.state.lastFinishedAt;
  }

  private source(id: IngestSourceId) {
    return this.state.sources.find((source) => source.id === id)!;
  }
}
