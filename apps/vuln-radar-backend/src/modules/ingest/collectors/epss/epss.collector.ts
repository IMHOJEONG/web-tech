import { Injectable } from '@nestjs/common';
import { EpssScoreEntry } from '../../ingest.types';

const EPSS_ENDPOINT = 'https://api.first.org/data/v1/epss';
const MAX_CVE_QUERY_LENGTH = 1900;

type EpssResponse = {
  data: Array<{
    cve: string;
    epss: string;
    percentile: string;
    date: string;
  }>;
};

@Injectable()
export class EpssCollector {
  async fetchScores(cveIds: string[]): Promise<EpssScoreEntry[]> {
    if (cveIds.length === 0) {
      return [];
    }

    const chunks = chunkCveIds(cveIds);
    const allScores: EpssScoreEntry[] = [];

    for (const chunk of chunks) {
      const requestUrl = new URL(EPSS_ENDPOINT);
      requestUrl.searchParams.set('cve', chunk.join(','));

      const response = await fetch(requestUrl, {
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new Error(
          `EPSS request failed: ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as EpssResponse;
      allScores.push(
        ...payload.data.map((entry) => ({
          cveId: entry.cve,
          score: Number(entry.epss),
          percentile: Number(entry.percentile),
          observedAt: new Date(`${entry.date}T00:00:00.000Z`),
        })),
      );
    }

    return allScores;
  }

  getSourceDefinition() {
    return {
      id: 'epss',
      name: 'FIRST EPSS API',
      kind: 'polling' as const,
      endpoint: EPSS_ENDPOINT,
      note: 'Scores are queried in batches by CVE ID.',
    };
  }
}

function chunkCveIds(cveIds: string[]) {
  const dedupedCveIds = [...new Set(cveIds)];
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const cveId of dedupedCveIds) {
    const additionalLength =
      currentChunk.length === 0 ? cveId.length : cveId.length + 1;

    if (currentLength + additionalLength > MAX_CVE_QUERY_LENGTH) {
      chunks.push(currentChunk);
      currentChunk = [cveId];
      currentLength = cveId.length;
      continue;
    }

    currentChunk.push(cveId);
    currentLength += additionalLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
