import { feedWhere, parseFeedQuery } from './feed-query';

describe('feed search query contract', () => {
  it('uses bounded defaults', () => {
    expect(parseFeedQuery({})).toEqual({
      q: '',
      priority: 'all',
      severity: 'all',
      kev: 'all',
      page: 1,
      pageSize: 25,
    });
  });
  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.2' },
    { page: '10001' },
    { page: 'Infinity' },
    { page: ['1', '2'] },
    { pageSize: '101' },
    { q: 'x'.repeat(121) },
    { q: { contains: 'x' } },
    { priority: 'P9' },
    { severity: 'unknown' },
    { kev: 'true' },
  ])('rejects malformed query %j', (query) => {
    expect(() => parseFeedQuery(query)).toThrow();
  });
  it('combines filters and binds literal LIKE text without SQL concatenation', () => {
    const query = parseFeedQuery({
      q: '  100%_safe  ',
      priority: 'P1',
      severity: 'high',
      kev: 'kev',
      page: '2',
    });
    const where = feedWhere(query);
    expect(where).toMatchObject({
      priority: 'P1',
      severity: { equals: 'high', mode: 'insensitive' },
      isKev: true,
    });
    expect(where.OR).toHaveLength(4);
    expect(where.OR?.[0]).toEqual({
      cveId: { contains: '100\\%\\_safe', mode: 'insensitive' },
    });
  });
});
