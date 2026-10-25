import { IngestObservation } from './ingest-observation';

describe('IngestObservation', () => {
  let time: string;
  let observation: IngestObservation;

  beforeEach(() => {
    time = '2026-10-22T00:00:00.000Z';
    observation = new IngestObservation(() => time);
  });

  it('starts unknown and labels its process-local scope', () => {
    expect(observation.snapshot()).toMatchObject({
      scope: 'process',
      outcome: 'unknown',
      lastSuccessAt: null,
    });
    expect(
      observation
        .snapshot()
        .sources.every((source) => source.lastFetchSuccessAt === null),
    ).toBe(true);
  });

  it('does not turn successful fetches into a successful database application', () => {
    observation.start();
    observation.sourceStarted('nvd');
    observation.sourceSucceeded('nvd');
    expect(observation.snapshot()).toMatchObject({
      outcome: 'running',
      lastSuccessAt: null,
    });
    observation.finish('failed');
    expect(observation.snapshot().sources[0]?.lastFetchSuccessAt).toBe(time);
    expect(observation.snapshot().lastSuccessAt).toBeNull();
  });

  it('preserves a previous full success when the next run is partial or fails', () => {
    observation.start();
    observation.finish('completed');
    const success = time;
    time = '2026-10-22T01:00:00.000Z';
    observation.start();
    observation.finish('partial');
    expect(observation.snapshot().lastSuccessAt).toBe(success);
    observation.start();
    observation.finish('failed');
    expect(observation.snapshot().lastSuccessAt).toBe(success);
    expect(observation.running).toBe(false);
  });

  it('retains source success across failures and resets the failure count only on success', () => {
    observation.start();
    observation.sourceStarted('epss');
    observation.sourceSucceeded('epss');
    const success = time;
    time = '2026-10-22T01:00:00.000Z';
    observation.sourceStarted('epss');
    observation.sourceFailed('epss');
    observation.sourceStarted('epss');
    observation.sourceFailed('epss');
    expect(observation.snapshot().sources[2]).toMatchObject({
      lastFetchSuccessAt: success,
      consecutiveFailures: 2,
      outcome: 'failed',
    });
    observation.sourceSucceeded('epss');
    expect(observation.snapshot().sources[2]).toMatchObject({
      consecutiveFailures: 0,
      lastFetchSuccessAt: time,
    });
  });

  it('does not let callers mutate recorded observations', () => {
    const snapshot = observation.snapshot();
    snapshot.sources[0]!.outcome = 'succeeded';
    expect(observation.snapshot().sources[0]!.outcome).toBe('unknown');
  });

  it('does not invent a successful EPSS fetch when there are no targets', () => {
    observation.start();
    observation.sourceSkipped('epss');
    expect(observation.snapshot().sources[2]).toMatchObject({
      outcome: 'skipped',
      lastFetchSuccessAt: null,
      lastAttemptAt: null,
    });
  });

  it('returns unknown after process restart instead of inferring history from records', () => {
    observation.start();
    observation.finish('completed');
    expect(
      new IngestObservation(() => time).snapshot().lastSuccessAt,
    ).toBeNull();
  });
});
