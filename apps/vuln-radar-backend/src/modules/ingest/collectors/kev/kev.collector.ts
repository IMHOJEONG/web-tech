import { Injectable } from '@nestjs/common';
import { KevCatalogEntry } from '../../ingest.types';

const KEV_ENDPOINT =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

type KevResponse = {
  vulnerabilities: Array<{
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    shortDescription: string;
    requiredAction: string;
    dueDate: string;
    dateAdded: string;
  }>;
};

@Injectable()
export class KevCollector {
  async fetchCatalog(): Promise<KevCatalogEntry[]> {
    const response = await fetch(KEV_ENDPOINT, {
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(
        `KEV request failed: ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as KevResponse;

    return payload.vulnerabilities.map((entry) => ({
      cveId: entry.cveID,
      vendorProject: entry.vendorProject,
      product: entry.product,
      vulnerabilityName: entry.vulnerabilityName,
      shortDescription: entry.shortDescription,
      requiredAction: entry.requiredAction,
      dueDate: entry.dueDate,
      dateAdded: entry.dateAdded,
    }));
  }

  getSourceDefinition() {
    return {
      id: 'kev',
      name: 'CISA KEV catalog',
      kind: 'polling' as const,
      endpoint: KEV_ENDPOINT,
      note: 'Official CISA catalog is a pull-based JSON feed, not a push stream.',
    };
  }
}
