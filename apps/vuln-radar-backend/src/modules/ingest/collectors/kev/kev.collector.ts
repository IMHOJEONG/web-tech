import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service';
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
  private readonly logger = new Logger(KevCollector.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async fetchCatalog(): Promise<KevCatalogEntry[]> {
    this.logger.log(
      `KEV catalog request started: timeoutMs=${this.appConfigService.ingestSourceTimeoutMs}`,
    );

    const response = await fetch(KEV_ENDPOINT, {
      signal: AbortSignal.timeout(this.appConfigService.ingestSourceTimeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `KEV request failed: ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as KevResponse;

    this.logger.log(
      `KEV catalog request completed: received=${payload.vulnerabilities.length}`,
    );

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
