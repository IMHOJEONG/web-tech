# 실데이터 ingest와 polling 기준

이 문서는 `vuln-radar-backend`가 mock을 넘어서
어떤 외부 소스를 실제로 읽는지와,
왜 이 구조를 `실시간 push`가 아니라 `near-real-time polling`으로 보는지 정리한다.

## 결론 먼저

- 현재 backend는 이미 외부 취약점 소스를 실제로 읽을 수 있다.
- 다만 upstream source들은 대부분 `push stream`이 아니라 `HTTP pull API` 또는 `JSON feed`다.
- 그래서 현재 “실시간”의 의미는
  `외부에서 이벤트가 밀려오는 구조`가 아니라
  `주기적으로 당겨와서 최신 상태에 가깝게 유지하는 구조`다.

## 현재 연결된 upstream source

### NVD

- endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- 역할: 최근 수정된 CVE 본문 수집
- 현재 collector 전략:
  - `lastModStartDate`
  - `lastModEndDate`
  - pagination

즉 NVD는 “최근 변경분을 창(window) 기준으로 다시 당겨오는 polling” 구조다.

### CISA KEV

- endpoint: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- 역할: 실제 악용 중인 CVE 목록 보강
- 현재 collector 전략:
  - 전체 catalog JSON pull
  - `cveID`, `dateAdded`, `vendorProject`, `product` 정규화

즉 KEV도 push가 아니라 “정기적으로 catalog를 다시 읽는 feed”다.

### FIRST EPSS

- endpoint: `https://api.first.org/data/v1/epss`
- 역할: CVE별 exploit probability 보강
- 현재 collector 전략:
  - CVE ID batch query
  - score / percentile 저장

즉 EPSS 역시 요청 시점에 조회하는 pull API다.

## 지금 backend가 제공하는 관측용 API

### `GET /api/ingest/sources`

현재 upstream source 정의를 돌려준다.

여기서 중요한 값:

- `mode: "pull"`
- 각 source의 `kind: "polling"`

즉 소스 정의 자체가 이미 “push stream이 아님”을 설명한다.

### `GET /api/ingest/status`

현재 DB 기준 ingest freshness를 보여준다.

주요 필드:

- `storage`
- `latest.databaseUpdatedAt`
- `latest.upstreamLastModifiedAt`
- `latest.kevCatalogAddedAt`
- `latest.epssObservedAt`
- `counts.vulnerabilities`
- `counts.p0`
- `counts.kevAdvisories`

이 엔드포인트는 “지금 DB가 얼마나 최신인지”를 보기 위한 것이다.

### `POST /api/ingest/sync`

실제 외부 소스를 당겨와서 DB를 갱신한다.

예시:

```bash
curl -X POST "http://127.0.0.1:4000/api/ingest/sync?lookbackHours=6"
```

이 응답은 다음을 보여준다.

- NVD에서 몇 건 읽었는지
- KEV catalog가 몇 건인지
- EPSS 점수를 몇 건 붙였는지
- watchlist match가 몇 건 생겼는지
- 최종적으로 몇 개 vulnerability snapshot을 처리했는지

## “실시간 조회 API가 존재하나?”에 대한 답

있다. 다만 구분해서 이해해야 한다.

### 1. upstream source API

존재한다.

- NVD API
- CISA KEV JSON feed
- FIRST EPSS API

하지만 이들은 현재 기준 모두 `pull` 방식으로 보는 편이 맞다.

### 2. 우리 backend API

존재한다.

- `/api/feed`
- `/api/overview`
- `/api/kev`
- `/api/watchlist`
- `/api/alerts`
- `/api/ingest/sources`
- `/api/ingest/status`
- `/api/ingest/sync`

즉 프론트는 이미 “실데이터가 들어간 read API”에 붙을 수 있다.

### 3. push-real-time stream

아직 없다.

예를 들면 아래는 아직 미구현이다.

- scheduler 기반 자동 sync
- SSE
- websocket
- source webhook

그래서 현재는
`manual sync 또는 추후 scheduler`
를 통해 near-real-time을 만드는 단계다.

## 자동 스케줄링 기준

현재 backend는 수동 sync만이 아니라
앱 내부 scheduler로 정기 ingest를 돌릴 수 있다.

관련 env:

- `INGEST_SCHEDULER_ENABLED`
- `INGEST_SYNC_INTERVAL_MINUTES`
- `INGEST_SYNC_ON_STARTUP`

권장 해석:

- `POST /api/ingest/sync`
  - parser, normalization, scoring 흐름을 수동 검증할 때 사용
- scheduler
  - 실제 운영에서 주기적으로 최신 상태를 유지할 때 사용

현재 구현은 단일 앱 인스턴스 기준의 단순 interval scheduler다.
나중에 replica가 여러 개가 되면
queue worker 또는 분리된 ingest worker로 옮기는 편이 더 안전하다.

## 현재 개발 기준

- mock fallback은 FE 계약 보호용으로 유지한다.
- DB가 준비되면 read API는 DB를 우선 사용한다.
- ingest는 먼저 수동 sync로 검증한다.
- 그다음 scheduler를 붙여 자동 polling으로 확장한다.
- push가 꼭 필요해지면 그때 SSE/websocket을 검토한다.

## mock fallback을 어떻게 식별하나

feed, overview, kev, watchlist, alerts 응답은 `dataSource` 메타데이터를 함께 내려준다.

- `kind`
  - `database`
  - `mock`
- `reason`
  - `live_read_model`
  - `derived_from_feed`
  - `database_unavailable`
  - `no_database_rows`
- `message`
  - 현재 응답이 왜 그 source로 내려왔는지 설명

즉 오래된 `generatedAt`이 보이면, 먼저 이 값을 본다.

- `kind: "database"`
  - 최신 read-model 기준 응답
- `kind: "mock"`
  - seed mock data 기준 응답

특히 `kind: "mock"`이면 날짜가 최신 ingest 시각이 아닐 수 있다.
