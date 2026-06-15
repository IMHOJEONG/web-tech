export const messages = {
  ko: {
    "app.eyebrow": "글로벌 취약점 레이더",
    "nav.overview": "개요",
    "common.notAvailableYet": "아직 확인되지 않음",
    "common.refresh": "새로고침",
    "common.refreshing": "새로고침 중...",
    "common.retry": "다시 시도",
    "common.backToOverview": "개요로 돌아가기",
    "common.detail": "상세 정보",
    "overview.loadingEyebrow": "대시보드 불러오는 중",
    "overview.loadingTitle": "취약점 현황을 불러오고 있습니다.",
    "overview.loadingBody":
      "상태, 수집 시점, 주요 지표, 피드, KEV, 워치리스트를 순서대로 확인하고 있습니다.",
    "overview.errorEyebrow": "데이터 불러오기 실패",
    "overview.errorTitle": "대시보드 데이터를 불러오지 못했습니다.",
    "overview.errorBody":
      "백엔드 상태와 프록시 연결을 확인한 뒤 다시 시도해 주세요.",
    "overview.heroEyebrow": "취약점 개요",
    "overview.heroTitle": "중요 취약점과 최신 수집 상태를 한눈에 확인합니다.",
    "overview.heroBody":
      "중요도, 실데이터 수집 상태, KEV 반영 여부, 워치리스트 매치를 한 화면에서 점검할 수 있습니다.",
    "overview.refreshingNotice":
      "최신 취약점 상태를 다시 불러오는 중입니다. 기존 데이터는 유지한 채 화면을 갱신합니다.",
    "overview.apiPath": "API 경로",
    "overview.storage": "저장소",
    "overview.upstream": "수집 방식",
    "overview.watchlistMatches": "워치리스트 매치",
    "overview.watchlistActive":
      "현재 활성화된 워치리스트 {{count}}개 기준으로 집계됩니다.",
    "overview.ingestFreshness": "수집 최신성",
    "overview.databaseUpdated": "DB 반영 시각",
    "overview.latestUpstreamModified": "최신 원본 수정 시각",
    "overview.latestKevAddition": "최신 KEV 반영 시각",
    "overview.latestEpssObserved": "최신 EPSS 관측 시각",
    "overview.coverageSnapshot": "적재 현황",
    "overview.vulnerabilityCount": "총 {{count}}건",
    "overview.p0Items": "P0 항목",
    "overview.p1Items": "P1 항목",
    "overview.kevAdvisories": "KEV 권고",
    "overview.watchlistEntries": "워치리스트",
    "overview.latestFeed": "최신 피드",
    "overview.newKevEntries": "새 KEV 항목",
    "overview.feedEpss": "EPSS {{score}}",
    "overview.cardDelta.p0-open":
      "현재 즉시 대응이 필요한 P0 취약점 {{count}}건",
    "overview.cardDelta.p1-open": "우선 점검이 필요한 P1 취약점 {{count}}건",
    "overview.cardDelta.kev-new": "KEV와 겹치는 취약점 {{count}}건",
    "overview.statusNote":
      "현재 백엔드는 외부 취약점 소스를 주기적으로 확인해 최신 상태에 가깝게 유지합니다.",
    "overview.sourceNote.nvd":
      "최근 수정된 CVE를 NVD에서 주기적으로 수집합니다.",
    "overview.sourceNote.kev":
      "CISA KEV 카탈로그를 주기적으로 다시 읽어 실제 악용 정보를 반영합니다.",
    "overview.sourceNote.epss":
      "EPSS 점수를 배치 조회해 exploit probability를 보강합니다.",
    "detail.loadingEyebrow": "상세 정보 불러오는 중",
    "detail.loadingTitle": "선택한 취약점 정보를 불러오고 있습니다.",
    "detail.errorEyebrow": "상세 정보 오류",
    "detail.errorTitle": "선택한 취약점 정보를 불러오지 못했습니다.",
    "detail.errorBody":
      "현재 데이터셋에 해당 CVE가 없거나, 백엔드 응답 형식이 기대와 다를 수 있습니다.",
    "detail.notFoundEyebrow": "상세 정보를 찾지 못함",
    "detail.notFoundTitle": "선택한 취약점이 현재 상세 데이터셋에 없습니다.",
    "detail.notFoundBody.mock":
      "현재 피드가 mock fallback을 사용 중일 수 있습니다. 목록에 보인 CVE라도 로컬 DB나 배포 DB에 아직 적재되지 않았을 수 있습니다.",
    "detail.notFoundBody.database":
      "현재 데이터베이스에서 이 CVE 레코드를 찾지 못했습니다. 아직 수집되지 않았거나, 현재 조회 범위에 없는 항목일 수 있습니다.",
    "detail.notFoundBody.unknown":
      "현재 피드 소스를 확인하지 못해 mock/DB 상태를 단정할 수 없습니다. 개요 페이지의 데이터 소스와 최신 피드를 함께 확인해 주세요.",
    "detail.notFoundSourceLabel": "현재 피드 소스",
    "detail.notFoundReasonLabel": "상태 설명",
    "detail.notFoundNextSteps": "다음에 확인할 것",
    "detail.notFoundStep.feed":
      "개요 페이지에서 현재 피드가 mock fallback인지 먼저 확인합니다.",
    "detail.notFoundStep.database":
      "실데이터를 기대한다면 ingest sync 이후 최신 feed에 나온 CVE ID로 다시 확인합니다.",
    "detail.notFoundStep.retry":
      "방금 수집을 실행했다면 잠시 뒤 새로고침해서 다시 확인합니다.",
    "detail.heroEyebrow": "취약점 상세",
    "detail.riskScore": "위험 점수",
    "detail.riskScoreBody":
      "현재 데이터베이스에 저장된 최신 평가 결과를 기준으로 합니다.",
    "detail.epssScore": "EPSS 점수",
    "detail.percentile": "백분위",
    "detail.cvssScore": "CVSS 점수",
    "detail.cvssBody": "심각도와 CVSS는 원본 CVE 데이터 기준으로 표시됩니다.",
    "detail.timeline": "타임라인",
    "detail.published": "공개 시각",
    "detail.updated": "수정 시각",
    "detail.nvdReference": "NVD 원문",
    "detail.openNvd": "NVD 상세 열기",
    "detail.watchlistMatches": "워치리스트 매치",
    "detail.matchesCount": "{{count}}건",
    "detail.noWatchlistMatch": "현재 저장된 워치리스트 매치 정보가 없습니다.",
    "detail.advisories": "권고 정보",
    "detail.advisoriesCount": "{{count}}건",
    "detail.openAdvisory": "원문 권고 열기",
    "detail.noAdvisories": "이 취약점에 연결된 권고 정보가 아직 없습니다.",
    "detail.notAvailable": "없음",
    "domain.storage.database": "데이터베이스",
    "domain.storage.mock": "목업",
    "domain.upstream.pull": "폴링",
    "domain.card.p0-open": "열린 P0",
    "domain.card.p1-open": "열린 P1",
    "domain.card.kev-new": "KEV 매치",
  },
  en: {
    "app.eyebrow": "Global Vuln Radar",
    "nav.overview": "Overview",
    "common.notAvailableYet": "Not available yet",
    "common.refresh": "Refresh",
    "common.refreshing": "Refreshing...",
    "common.retry": "Retry",
    "common.backToOverview": "Back to overview",
    "common.detail": "Detail",
    "overview.loadingEyebrow": "Loading Dashboard",
    "overview.loadingTitle": "Loading vulnerability status.",
    "overview.loadingBody":
      "Checking health, ingest freshness, key metrics, feed, KEV, and watchlist coverage.",
    "overview.errorEyebrow": "Load Failed",
    "overview.errorTitle": "The dashboard data could not be loaded.",
    "overview.errorBody":
      "Check backend health and proxy connectivity, then try again.",
    "overview.heroEyebrow": "Overview",
    "overview.heroTitle":
      "Review critical vulnerabilities and the latest ingest status at a glance.",
    "overview.heroBody":
      "Track priority, ingest freshness, KEV overlap, and watchlist matches from one screen.",
    "overview.refreshingNotice":
      "Refreshing the latest vulnerability state while keeping the current data visible.",
    "overview.apiPath": "API path",
    "overview.storage": "Storage",
    "overview.upstream": "Upstream",
    "overview.watchlistMatches": "Watchlist matches",
    "overview.watchlistActive":
      "Calculated from {{count}} active watchlist entries.",
    "overview.ingestFreshness": "Ingest freshness",
    "overview.databaseUpdated": "Database updated",
    "overview.latestUpstreamModified": "Latest upstream modified",
    "overview.latestKevAddition": "Latest KEV addition",
    "overview.latestEpssObserved": "Latest EPSS observed",
    "overview.coverageSnapshot": "Coverage snapshot",
    "overview.vulnerabilityCount": "{{count}} vulnerabilities",
    "overview.p0Items": "P0 items",
    "overview.p1Items": "P1 items",
    "overview.kevAdvisories": "KEV advisories",
    "overview.watchlistEntries": "Watchlist entries",
    "overview.latestFeed": "Latest feed",
    "overview.newKevEntries": "New KEV entries",
    "overview.feedEpss": "EPSS {{score}}",
    "overview.cardDelta.p0-open":
      "{{count}} P0 vulnerabilities currently require immediate attention",
    "overview.cardDelta.p1-open":
      "{{count}} P1 vulnerabilities currently need review",
    "overview.cardDelta.kev-new":
      "{{count}} vulnerabilities currently overlap with KEV",
    "overview.statusNote":
      "The backend polls upstream vulnerability sources to keep the dataset near real time.",
    "overview.sourceNote.nvd": "Polling NVD for recently modified CVEs.",
    "overview.sourceNote.kev":
      "Re-reading the CISA KEV catalog to reflect known exploited vulnerabilities.",
    "overview.sourceNote.epss":
      "Batch-fetching EPSS scores to enrich exploitability signals.",
    "detail.loadingEyebrow": "Loading detail",
    "detail.loadingTitle": "Loading the selected vulnerability.",
    "detail.errorEyebrow": "Detail error",
    "detail.errorTitle": "The selected vulnerability could not be loaded.",
    "detail.errorBody":
      "The CVE may not exist in the current dataset or the backend returned an unexpected response.",
    "detail.notFoundEyebrow": "Detail not found",
    "detail.notFoundTitle":
      "The selected vulnerability is not available in the current detail dataset.",
    "detail.notFoundBody.mock":
      "The current feed may still be using mock fallback data. A CVE visible in the list may not be ingested into the local or deployed database yet.",
    "detail.notFoundBody.database":
      "The current database does not contain a record for this CVE yet. It may not have been ingested or may be outside the current dataset window.",
    "detail.notFoundBody.unknown":
      "The current feed source could not be confirmed, so the app cannot tell whether this is a mock/database mismatch. Check the overview source badges and latest feed first.",
    "detail.notFoundSourceLabel": "Current feed source",
    "detail.notFoundReasonLabel": "Status note",
    "detail.notFoundNextSteps": "What to check next",
    "detail.notFoundStep.feed":
      "Check whether the current feed is using mock fallback on the overview page.",
    "detail.notFoundStep.database":
      "If you expect live data, run ingest sync and retry with a CVE ID that appears in the latest feed.",
    "detail.notFoundStep.retry":
      "If a sync just completed, wait a moment and refresh this page again.",
    "detail.heroEyebrow": "Vulnerability detail",
    "detail.riskScore": "Risk score",
    "detail.riskScoreBody":
      "Based on the latest evaluation stored in the database.",
    "detail.epssScore": "EPSS score",
    "detail.percentile": "Percentile",
    "detail.cvssScore": "CVSS score",
    "detail.cvssBody":
      "Severity and CVSS are shown from the upstream CVE data.",
    "detail.timeline": "Timeline",
    "detail.published": "Published",
    "detail.updated": "Updated",
    "detail.nvdReference": "NVD reference",
    "detail.openNvd": "Open NVD detail",
    "detail.watchlistMatches": "Watchlist matches",
    "detail.matchesCount": "{{count}} matches",
    "detail.noWatchlistMatch":
      "No active watchlist match is stored for this CVE.",
    "detail.advisories": "Advisories",
    "detail.advisoriesCount": "{{count}} records",
    "detail.openAdvisory": "Open advisory source",
    "detail.noAdvisories":
      "No advisory records are currently attached to this vulnerability.",
    "detail.notAvailable": "Not available",
    "domain.storage.database": "Database",
    "domain.storage.mock": "Mock",
    "domain.upstream.pull": "Pull",
    "domain.card.p0-open": "Open P0",
    "domain.card.p1-open": "Open P1",
    "domain.card.kev-new": "KEV matches",
  },
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof (typeof messages)["ko"];
