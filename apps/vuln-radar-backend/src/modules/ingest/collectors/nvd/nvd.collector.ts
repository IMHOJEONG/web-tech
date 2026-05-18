import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service';
import { CollectedVulnerability } from '../../ingest.types';

const NVD_ENDPOINT = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

type NvdResponse = {
  startIndex: number;
  totalResults: number;
  resultsPerPage: number;
  vulnerabilities: Array<{
    cve: {
      id: string;
      published: string;
      lastModified: string;
      descriptions?: Array<{ lang: string; value: string }>;
      metrics?: Record<
        string,
        Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }>
      >;
    };
  }>;
};

@Injectable()
export class NvdCollector {
  constructor(private readonly appConfigService: AppConfigService) {}

  async fetchRecent(lookbackHours: number): Promise<CollectedVulnerability[]> {
    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - lookbackHours * 60 * 60 * 1000,
    );

    const allVulnerabilities: CollectedVulnerability[] = [];
    let startIndex = 0;
    const resultsPerPage = 2000;

    while (true) {
      const requestUrl = new URL(NVD_ENDPOINT);
      requestUrl.searchParams.set('lastModStartDate', startDate.toISOString());
      requestUrl.searchParams.set('lastModEndDate', endDate.toISOString());
      requestUrl.searchParams.set('resultsPerPage', String(resultsPerPage));
      requestUrl.searchParams.set('startIndex', String(startIndex));

      const response = await fetch(requestUrl, {
        headers: this.appConfigService.nvdApiKey
          ? {
              apiKey: this.appConfigService.nvdApiKey,
            }
          : undefined,
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new Error(
          `NVD request failed: ${response.status} ${response.statusText}`,
        );
      }

      const payload = (await response.json()) as NvdResponse;

      allVulnerabilities.push(
        ...payload.vulnerabilities.map((item) => mapNvdVulnerability(item.cve)),
      );

      startIndex += payload.resultsPerPage;

      if (startIndex >= payload.totalResults) {
        break;
      }
    }

    return allVulnerabilities;
  }

  getSourceDefinition() {
    return {
      id: 'nvd',
      name: 'NVD CVE API 2.0',
      kind: 'polling' as const,
      endpoint: NVD_ENDPOINT,
      note: 'Recent updates are pulled by last modified window.',
    };
  }
}

function mapNvdVulnerability(
  cve: NvdResponse['vulnerabilities'][number]['cve'],
): CollectedVulnerability {
  const description =
    cve.descriptions?.find((item) => item.lang === 'en')?.value ??
    'No English description provided by NVD.';

  const metric =
    cve.metrics?.cvssMetricV31?.[0] ??
    cve.metrics?.cvssMetricV30?.[0] ??
    cve.metrics?.cvssMetricV2?.[0];

  const severity = metric?.cvssData?.baseSeverity ?? null;
  const cvssScore = metric?.cvssData?.baseScore ?? null;

  return {
    cveId: cve.id,
    title: deriveTitle(cve.id, description),
    description,
    severity,
    cvssScore,
    publishedAt: new Date(cve.published),
    lastModifiedAt: new Date(cve.lastModified),
    rawSourceJson: cve as unknown as Record<string, unknown>,
  };
}

function deriveTitle(cveId: string, description: string) {
  const cleanDescription = description.replace(/\s+/g, ' ').trim();
  const shortDescription =
    cleanDescription.split('. ')[0]?.trim() ?? cleanDescription;
  return shortDescription.length > 0 ? shortDescription : cveId;
}
