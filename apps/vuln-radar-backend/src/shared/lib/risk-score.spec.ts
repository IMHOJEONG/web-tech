import { calculateRiskScore } from './risk-score';

describe('calculateRiskScore', () => {
  it('returns P0 for KEV + high exploitability + watchlist match', () => {
    const result = calculateRiskScore({
      severity: 'critical',
      isKev: true,
      epssPercentile: 0.99,
      matchedValues: ['citrix'],
      title: 'Gateway authentication bypass',
      description: 'Remote code execution with public PoC.',
    });

    expect(result).toEqual({
      score: 145,
      priority: 'P0',
    });
  });

  it('returns lower priority when signals are weak', () => {
    const result = calculateRiskScore({
      severity: 'medium',
      isKev: false,
      epssPercentile: 0.1,
      matchedValues: [],
      title: 'Minor denial of service issue',
      description: 'No known exploit activity.',
    });

    expect(result.priority).toBe('P3');
  });
});
