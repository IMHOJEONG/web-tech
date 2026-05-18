import type { RadarPriority } from '../types/radar';

export interface RiskScoreInput {
  severity?: string | null;
  isKev: boolean;
  epssPercentile?: number | null;
  matchedValues: string[];
  title: string;
  description: string;
}

export interface RiskScoreResult {
  score: number;
  priority: RadarPriority;
}

export function calculateRiskScore(input: RiskScoreInput): RiskScoreResult {
  const searchableText = `${input.title} ${input.description}`.toLowerCase();
  let score = 0;

  if (input.isKev) {
    score += 50;
  }

  if ((input.epssPercentile ?? 0) >= 0.95) {
    score += 25;
  }

  const normalizedSeverity = input.severity?.toLowerCase();

  if (normalizedSeverity === 'critical') {
    score += 20;
  } else if (normalizedSeverity === 'high') {
    score += 10;
  }

  if (input.matchedValues.length > 0) {
    score += 15;
  }

  if (
    searchableText.includes('remote code execution') ||
    searchableText.includes(' rce')
  ) {
    score += 15;
  }

  if (
    searchableText.includes('auth bypass') ||
    searchableText.includes('authentication bypass')
  ) {
    score += 10;
  }

  if (
    searchableText.includes('proof of concept') ||
    searchableText.includes('public poc') ||
    searchableText.includes('public exploit')
  ) {
    score += 10;
  }

  if (score >= 80) {
    return {
      score,
      priority: 'P0',
    };
  }

  if (score >= 60) {
    return {
      score,
      priority: 'P1',
    };
  }

  if (score >= 40) {
    return {
      score,
      priority: 'P2',
    };
  }

  return {
    score,
    priority: 'P3',
  };
}
