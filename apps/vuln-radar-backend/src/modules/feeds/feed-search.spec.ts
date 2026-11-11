import { FeedsRepository } from './feeds.repository';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { parseFeedQuery } from './feed-query';

describe('full database feed search repository', () => {
  const count = jest.fn();
  const findMany = jest.fn();
  const tx = { vulnerability: { count, findMany } };
  const transaction = jest.fn(
    async (task: (client: typeof tx) => Promise<unknown>) => task(tx),
  );
  const getClient = jest.fn();
  const repository = new FeedsRepository({
    getClient,
  } as unknown as PrismaService);
  const row = (n: number) => ({
    cveId: 'CVE-2099-' + String(10000 + n),
    title: 'Synthetic needle ' + n,
    description: 'Synthetic',
    severity: 'HIGH',
    cvssScore: 7,
    epssScore: null,
    epssPercentile: null,
    isKev: false,
    priority: 'P1',
    publishedAt: new Date(0),
    lastModifiedAt: new Date(1),
    updatedAt: new Date(1),
    watchMatches: [],
    advisories: [],
  });
  beforeEach(() => {
    jest.clearAllMocks();
    getClient.mockResolvedValue({ $transaction: transaction });
    count.mockResolvedValue(60);
    findMany.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => row(i + 25)),
    );
  });
  it('counts the full filtered set and reads page two with identical predicates', async () => {
    const result = await repository.searchFeed(
      parseFeedQuery({ q: 'needle', page: '2' }),
    );
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 25,
      total: 60,
      totalPages: 3,
    });
    expect(result.items[0]?.cveId).toBe('CVE-2099-10025');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: count.mock.calls[0][0].where,
        skip: 25,
        take: 25,
        orderBy: [{ lastModifiedAt: 'desc' }, { cveId: 'asc' }],
      }),
    );
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'RepeatableRead',
    });
  });
  it('returns real empty results instead of mock fallback', async () => {
    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    const result = await repository.searchFeed(
      parseFeedQuery({ q: 'absent', page: '50' }),
    );
    expect(result.items).toEqual([]);
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    });
    expect(result.dataSource.kind).toBe('database');
  });
  it('clamps a now-out-of-range page after data removal', async () => {
    count.mockResolvedValue(26);
    findMany.mockResolvedValue([row(25)]);
    expect(
      (await repository.searchFeed(parseFeedQuery({ page: '4' }))).pagination
        .page,
    ).toBe(2);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 25 }),
    );
  });
  it('propagates failed reads instead of reporting zero results', async () => {
    count.mockRejectedValueOnce(new Error('synthetic DB outage'));
    await expect(repository.searchFeed(parseFeedQuery({}))).rejects.toThrow(
      'synthetic DB outage',
    );
  });
  it('returns unavailable rather than fabricated database search', async () => {
    getClient.mockResolvedValue(null);
    await expect(repository.searchFeed(parseFeedQuery({}))).rejects.toThrow(
      'requires database',
    );
    expect(transaction).not.toHaveBeenCalled();
  });
});
