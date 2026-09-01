import { AppConfigService } from '../../../../config/app-config.service';
import { NvdCollector } from './nvd.collector';

describe('NvdCollector', () => {
  const createAppConfigService = (
    overrides?: Partial<{
      ingestSourceTimeoutMs: number;
      nvdApiKey: string;
      nvdRequestMaxRetries: number;
      nvdRequestPageDelayMs: number;
      nvdRequestRetryDelayMs: number;
      nvdResultsPerPage: number;
    }>,
  ) =>
    ({
      ingestSourceTimeoutMs: overrides?.ingestSourceTimeoutMs ?? 60_000,
      nvdApiKey: overrides?.nvdApiKey,
      nvdRequestMaxRetries: overrides?.nvdRequestMaxRetries ?? 2,
      nvdRequestPageDelayMs: overrides?.nvdRequestPageDelayMs ?? 0,
      nvdRequestRetryDelayMs: overrides?.nvdRequestRetryDelayMs ?? 0,
      nvdResultsPerPage: overrides?.nvdResultsPerPage ?? 200,
    }) as AppConfigService;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retries retryable terminated NVD requests', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('terminated'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            startIndex: 0,
            totalResults: 1,
            resultsPerPage: 200,
            vulnerabilities: [
              {
                cve: {
                  id: 'CVE-2026-0001',
                  published: '2026-09-01T00:00:00.000Z',
                  lastModified: '2026-09-01T00:00:00.000Z',
                  descriptions: [
                    {
                      lang: 'en',
                      value: 'A retryable test vulnerability.',
                    },
                  ],
                },
              },
            ],
          }),
          {
            status: 200,
          },
        ),
      );

    const collector = new NvdCollector(createAppConfigService());
    const vulnerabilities = await collector.fetchRecent(24);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(vulnerabilities).toHaveLength(1);
    expect(vulnerabilities[0]?.cveId).toBe('CVE-2026-0001');
  });

  it('does not retry non-retryable NVD client errors', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', {
        status: 403,
        statusText: 'Forbidden',
      }),
    );

    const collector = new NvdCollector(createAppConfigService());

    await expect(collector.fetchRecent(24)).rejects.toThrow(
      'NVD request failed: 403 Forbidden',
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('uses configured NVD page size', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          startIndex: 0,
          totalResults: 0,
          resultsPerPage: 100,
          vulnerabilities: [],
        }),
        {
          status: 200,
        },
      ),
    );

    const collector = new NvdCollector(
      createAppConfigService({
        nvdResultsPerPage: 100,
      }),
    );

    await collector.fetchRecent(24);

    const requestUrl = fetchSpy.mock.calls[0]?.[0] as URL;
    expect(requestUrl.searchParams.get('resultsPerPage')).toBe('100');
  });
});
