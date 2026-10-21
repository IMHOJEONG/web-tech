import { PrismaService } from '../../infra/prisma/prisma.service';
import { FeedsRepository } from './feeds.repository';

describe('FeedsRepository overview statistics', () => {
  const groupBy = jest.fn();
  const findMany = jest.fn();
  const getClient = jest.fn();
  const repository = new FeedsRepository({
    getClient,
  } as unknown as PrismaService);
  const values = (
    response: Awaited<ReturnType<typeof repository.getOverview>>,
  ) => Object.fromEntries(response.cards.map((card) => [card.id, card.value]));

  beforeEach(() => {
    jest.resetAllMocks();
    getClient.mockResolvedValue({ vulnerability: { groupBy, findMany } });
    findMany.mockRejectedValue(
      new Error('Overview must not read the limited feed'),
    );
  });

  it('counts all priority/KEV groups beyond the 25-row feed limit in one query', async () => {
    groupBy.mockResolvedValue([
      { priority: 'P0', isKev: true, _count: { _all: 30 } },
      { priority: 'P0', isKev: false, _count: { _all: 2 } },
      { priority: 'P1', isKev: true, _count: { _all: 8 } },
      { priority: 'P1', isKev: false, _count: { _all: 3 } },
      { priority: 'P2', isKev: false, _count: { _all: 5 } },
      { priority: 'P3', isKev: true, _count: { _all: 1 } },
    ]);

    const response = await repository.getOverview();

    expect(values(response)).toEqual({
      'p0-open': 32,
      'p1-open': 11,
      'kev-new': 39,
      'total-vulnerabilities': 49,
    });
    expect(response.dataSource).toMatchObject({
      kind: 'database',
      reason: 'live_read_model',
    });
    expect(groupBy).toHaveBeenCalledTimes(1);
    expect(groupBy).toHaveBeenCalledWith({
      by: ['priority', 'isKev'],
      _count: { _all: true },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('reports a connected empty database as real zero counts, not seed mock data', async () => {
    groupBy.mockResolvedValue([]);
    const response = await repository.getOverview();
    expect(values(response)).toEqual({
      'p0-open': 0,
      'p1-open': 0,
      'kev-new': 0,
      'total-vulnerabilities': 0,
    });
    expect(response.dataSource.kind).toBe('database');
    expect(findMany).not.toHaveBeenCalled();
  });

  it('keeps absent priorities and KEV at zero without advisory-row counts', async () => {
    groupBy.mockResolvedValue([
      { priority: 'P3', isKev: false, _count: { _all: 40 } },
    ]);
    expect(values(await repository.getOverview())).toEqual({
      'p0-open': 0,
      'p1-open': 0,
      'kev-new': 0,
      'total-vulnerabilities': 40,
    });
  });

  it('marks unavailable storage as mock instead of claiming real database counts', async () => {
    getClient.mockResolvedValue(null);
    const response = await repository.getOverview();
    expect(response.dataSource).toMatchObject({
      kind: 'mock',
      reason: 'database_unavailable',
    });
    expect(values(response)['total-vulnerabilities']).toBeGreaterThan(0);
    expect(values(response)).toEqual({
      'p0-open': 1,
      'p1-open': 2,
      'kev-new': 1,
      'total-vulnerabilities': 3,
    });
    expect(groupBy).not.toHaveBeenCalled();
  });

  it('propagates database query errors instead of silently showing zero or mock counts', async () => {
    groupBy.mockRejectedValue(new Error('database query failed'));
    await expect(repository.getOverview()).rejects.toThrow(
      'database query failed',
    );
  });
});
