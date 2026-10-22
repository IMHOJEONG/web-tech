import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(NvdCollector.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async fetchRecent(lookbackHours: number): Promise<CollectedVulnerability[]> {
    const endDate = new Date();
    const startDate = new Date(
      endDate.getTime() - lookbackHours * 60 * 60 * 1000,
    );

    const allVulnerabilities: CollectedVulnerability[] = [];
    let startIndex = 0;
    const resultsPerPage = this.appConfigService.nvdResultsPerPage;

    while (true) {
      const requestUrl = new URL(NVD_ENDPOINT);
      requestUrl.searchParams.set('lastModStartDate', startDate.toISOString());
      requestUrl.searchParams.set('lastModEndDate', endDate.toISOString());
      requestUrl.searchParams.set('resultsPerPage', String(resultsPerPage));
      requestUrl.searchParams.set('startIndex', String(startIndex));

      this.logger.log(
        `NVD page request started: lookbackHours=${lookbackHours}, startIndex=${startIndex}, resultsPerPage=${resultsPerPage}, timeoutMs=${this.appConfigService.ingestSourceTimeoutMs}`,
      );

      const payload = await this.fetchPageWithRetry(requestUrl);

      this.logger.log(
        `NVD page request completed: startIndex=${startIndex}, received=${payload.vulnerabilities.length}, total=${payload.totalResults}, resultsPerPage=${payload.resultsPerPage}`,
      );

      allVulnerabilities.push(
        ...payload.vulnerabilities.map((item) => mapNvdVulnerability(item.cve)),
      );

      startIndex += payload.resultsPerPage;

      if (startIndex >= payload.totalResults) {
        break;
      }

      await sleep(this.appConfigService.nvdRequestPageDelayMs);
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

  private async fetchPageWithRetry(requestUrl: URL): Promise<NvdResponse> {
    const maxAttempts = this.appConfigService.nvdRequestMaxRetries + 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = Date.now();

      try {
        const response = await fetch(requestUrl, {
          headers: this.appConfigService.nvdApiKey
            ? {
                apiKey: this.appConfigService.nvdApiKey,
              }
            : undefined,
          signal: AbortSignal.timeout(
            this.appConfigService.ingestSourceTimeoutMs,
          ),
        });

        if (!response.ok) {
          const apiMessage = response.headers.get('message');
          const messageSuffix = apiMessage ? ` message=${apiMessage}` : '';

          throw new NvdRequestError(
            `NVD request failed: ${response.status} ${response.statusText}${messageSuffix}`,
            isRetryableStatus(response.status),
          );
        }

        return (await response.json()) as NvdResponse;
      } catch (error) {
        lastError = error;

        const retryable = isRetryableNvdError(error);
        const shouldRetry = retryable && attempt < maxAttempts;

        this.logger.warn(
          `NVD page request ${
            shouldRetry ? 'will retry' : 'failed'
          }: attempt=${attempt}/${maxAttempts}, durationMs=${
            Date.now() - startedAt
          }, retryable=${retryable}, error=${formatErrorMessage(error)}`,
        );

        if (!shouldRetry) {
          break;
        }

        await sleep(this.appConfigService.nvdRequestRetryDelayMs * attempt);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('NVD request failed with an unknown error');
  }
}

class NvdRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

function isRetryableStatus(statusCode: number) {
  return statusCode === 429 || statusCode >= 500;
}

function isRetryableNvdError(error: unknown) {
  if (error instanceof NvdRequestError) {
    return error.retryable;
  }

  const message = formatErrorMessage(error).toLowerCase();

  return (
    message.includes('terminated') ||
    message.includes('timeout') ||
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('etimedout')
  );
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function sleep(durationMs: number) {
  if (durationMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
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
