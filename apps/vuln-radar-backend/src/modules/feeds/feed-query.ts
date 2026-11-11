import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/index.js';

export interface FeedQuery {
  q: string;
  priority: string;
  severity: string;
  kev: string;
  page: number;
  pageSize: number;
}

export function parseFeedQuery(raw: Record<string, unknown>): FeedQuery {
  const text = (key: string, fallback: string) => {
    const value = raw[key] ?? fallback;
    if (typeof value !== 'string')
      throw new BadRequestException('Invalid feed query');
    return value.trim();
  };
  const integer = (key: string, fallback: string, max: number) => {
    const value = text(key, fallback);
    if (
      !/^[1-9]\d*$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) > max
    ) {
      throw new BadRequestException('Invalid feed pagination');
    }
    return Number(value);
  };
  const q = text('q', '');
  const priority = text('priority', 'all');
  const severity = text('severity', 'all');
  const kev = text('kev', 'all');
  if (
    q.length > 120 ||
    !['all', 'P0', 'P1', 'P2', 'P3'].includes(priority) ||
    !['all', 'critical', 'high', 'medium', 'low'].includes(severity) ||
    !['all', 'kev'].includes(kev)
  )
    throw new BadRequestException('Invalid feed filters');
  return {
    q,
    priority,
    severity,
    kev,
    page: integer('page', '1', 10000),
    pageSize: integer('pageSize', '25', 100),
  };
}

export function feedWhere(query: FeedQuery): Prisma.VulnerabilityWhereInput {
  // Prisma binds SQL parameters; escape LIKE metacharacters for literal substring search.
  const contains = query.q.replace(/[\\%_]/g, '\\$&');
  const where: Prisma.VulnerabilityWhereInput = {};
  if (query.priority !== 'all')
    where.priority = query.priority as 'P0' | 'P1' | 'P2' | 'P3';
  if (query.severity === 'low') {
    where.AND = [
      {
        OR: [
          { severity: null },
          {
            NOT: {
              OR: ['critical', 'high', 'medium'].map((equals) => ({
                severity: { equals, mode: 'insensitive' as const },
              })),
            },
          },
        ],
      },
    ];
  } else if (query.severity !== 'all') {
    where.severity = { equals: query.severity, mode: 'insensitive' };
  }
  if (query.kev === 'kev') where.isKev = true;
  if (contains)
    where.OR = [
      { cveId: { contains, mode: 'insensitive' } },
      { title: { contains, mode: 'insensitive' } },
      { description: { contains, mode: 'insensitive' } },
      {
        watchMatches: {
          some: { matchedValue: { contains, mode: 'insensitive' } },
        },
      },
      ...(query.q.toLowerCase() === 'kev' ? [{ isKev: true }] : []),
    ];
  return where;
}
