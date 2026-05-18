export const radarGeneratedAt = '2026-05-18T09:00:00.000Z';

export const vulnerabilitySeeds = [
  {
    cveId: 'CVE-2026-10001',
    title: 'Citrix NetScaler gateway auth bypass under active exploitation',
    description:
      'Authentication bypass in NetScaler edge deployments with active exploitation pressure.',
    severity: 'critical',
    cvssScore: 9.8,
    epssScore: 0.98,
    epssPercentile: 0.99,
    isKev: true,
    riskScore: 92,
    priority: 'P0' as const,
    publishedAt: new Date('2026-05-18T02:12:00.000Z'),
    lastModifiedAt: new Date('2026-05-18T06:40:00.000Z'),
    rawSourceJson: {
      source: 'seed',
      vendor: 'citrix',
    },
  },
  {
    cveId: 'CVE-2026-10019',
    title: 'Kubernetes ingress controller remote code execution candidate',
    description:
      'Ingress controller issue with likely remote code execution impact and strong exploitability indicators.',
    severity: 'high',
    cvssScore: 8.6,
    epssScore: 0.91,
    epssPercentile: 0.97,
    isKev: false,
    riskScore: 74,
    priority: 'P1' as const,
    publishedAt: new Date('2026-05-17T18:30:00.000Z'),
    lastModifiedAt: new Date('2026-05-18T05:15:00.000Z'),
    rawSourceJson: {
      source: 'seed',
      vendor: 'kubernetes',
    },
  },
  {
    cveId: 'CVE-2026-10044',
    title: 'PostgreSQL extension privilege escalation with public PoC',
    description:
      'Extension-level privilege escalation bug with public proof-of-concept and developer platform impact.',
    severity: 'high',
    cvssScore: 8.1,
    epssScore: 0.87,
    epssPercentile: 0.95,
    isKev: false,
    riskScore: 69,
    priority: 'P1' as const,
    publishedAt: new Date('2026-05-17T22:50:00.000Z'),
    lastModifiedAt: new Date('2026-05-18T04:02:00.000Z'),
    rawSourceJson: {
      source: 'seed',
      vendor: 'postgresql',
    },
  },
];

export const advisorySeeds = [
  {
    vulnerabilityCveId: 'CVE-2026-10001',
    source: 'cisa-kev',
    externalId: 'kev-cve-2026-10001',
    title: 'CISA KEV catalog entry',
    summary:
      'KEV entry marking active exploitation against Citrix edge deployments.',
    sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    publishedAt: new Date('2026-05-18T05:30:00.000Z'),
    lastModifiedAt: new Date('2026-05-18T05:30:00.000Z'),
    rawSourceJson: {
      dueDate: '2026-05-25',
      knownRansomwareUse: false,
    },
  },
  {
    vulnerabilityCveId: 'CVE-2026-10019',
    source: 'vendor-advisory',
    externalId: 'vendor-k8s-2026-10019',
    title: 'Kubernetes ingress advisory',
    summary:
      'Ingress controller maintainers published mitigations and patch guidance.',
    sourceUrl: 'https://kubernetes.io/security/',
    publishedAt: new Date('2026-05-18T03:00:00.000Z'),
    lastModifiedAt: new Date('2026-05-18T03:40:00.000Z'),
    rawSourceJson: {
      ecosystem: 'kubernetes',
    },
  },
];

export const epssScoreSeeds = [
  {
    vulnerabilityCveId: 'CVE-2026-10001',
    score: 0.98,
    percentile: 0.99,
    observedAt: new Date('2026-05-18T06:00:00.000Z'),
  },
  {
    vulnerabilityCveId: 'CVE-2026-10019',
    score: 0.91,
    percentile: 0.97,
    observedAt: new Date('2026-05-18T06:00:00.000Z'),
  },
  {
    vulnerabilityCveId: 'CVE-2026-10044',
    score: 0.87,
    percentile: 0.95,
    observedAt: new Date('2026-05-18T06:00:00.000Z'),
  },
];

export const watchlistEntrySeeds = [
  {
    type: 'vendor' as const,
    value: 'citrix',
    enabled: true,
  },
  {
    type: 'product' as const,
    value: 'kubernetes',
    enabled: true,
  },
  {
    type: 'ecosystem' as const,
    value: 'pypi',
    enabled: true,
  },
  {
    type: 'keyword' as const,
    value: 'auth bypass',
    enabled: true,
  },
];

export const watchMatchSeeds = [
  {
    vulnerabilityCveId: 'CVE-2026-10001',
    watchlistType: 'vendor' as const,
    watchlistValue: 'citrix',
    matchedValue: 'citrix',
  },
  {
    vulnerabilityCveId: 'CVE-2026-10001',
    watchlistType: 'keyword' as const,
    watchlistValue: 'auth bypass',
    matchedValue: 'gateway',
  },
  {
    vulnerabilityCveId: 'CVE-2026-10019',
    watchlistType: 'product' as const,
    watchlistValue: 'kubernetes',
    matchedValue: 'kubernetes',
  },
  {
    vulnerabilityCveId: 'CVE-2026-10044',
    watchlistType: 'keyword' as const,
    watchlistValue: 'auth bypass',
    matchedValue: 'postgresql',
  },
];

export const alertSeeds = [
  {
    vulnerabilityCveId: 'CVE-2026-10001',
    title: 'Citrix NetScaler auth bypass matched watchlist',
    priority: 'P0' as const,
    channel: 'slack' as const,
    status: 'sent' as const,
    sentAt: new Date('2026-05-18T06:45:00.000Z'),
  },
  {
    vulnerabilityCveId: 'CVE-2026-10019',
    title: 'Kubernetes ingress controller candidate needs review',
    priority: 'P1' as const,
    channel: 'discord' as const,
    status: 'pending' as const,
    sentAt: new Date('2026-05-18T06:50:00.000Z'),
  },
];
