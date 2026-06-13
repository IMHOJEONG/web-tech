## `apps/vuln-radar-backend`

`apps/vuln-radar-backend`는 `Global Vuln Radar`의 수집, 정규화, 점수 계산, 알림, API 계층을 담당한다.
현재는 Nest 기본 골격에서 출발하지만, 목표 구조는 `취약점 수집 파이프라인 + 운영 API` 중심으로 재구성하는 것이다.

## 권장 기술 스택

- `Node.js`
- `NestJS`
- `TypeScript`
- `PostgreSQL`
- `Prisma`
- `Redis + BullMQ`
- `zod`
- `REST + SSE`
- `Jest`
- `Prisma 7 config`

## 기본 포트

- frontend: `3000`
- backend: `4000`

개발 중 프론트는 `/api/backend/*`만 호출하고, 실제 backend origin 매핑은 프론트의 proxy 계층이 담당한다.

## 빌드 산출물 기준

- 현재 Nest build 결과의 entry는 `dist/main.js`가 아니라 `dist/src/main.js`다.
- 따라서 Docker/배포 환경의 start command도 이 경로를 기준으로 맞춰야 한다.
- `/app/dist/main`을 바라보면 `MODULE_NOT_FOUND`가 발생한다.
- `pnpm deploy`는 tarball 기준으로 파일을 담기 때문에, `dist`와 `generated/prisma`가 package 파일 목록에 포함되어 있어야 한다.
- 현재는 `package.json > files`에 해당 경로를 명시해서 runtime 이미지에도 같이 들어가도록 맞췄다.

## 환경 변수 로딩 기준

- 로컬 개발에서는 `apps/vuln-radar-backend/.env`를 둘 수 있다.
- 배포 환경에서는 `.env` 파일이 없어도 된다.
- 현재 backend는 `.env` 파일이 있으면 읽고, 없으면 무시한 뒤 런타임 환경변수만 사용한다.

즉 Railway 같은 PaaS에서는 파일 업로드 대신 Variables 설정만 맞추면 된다.

예시:

- `PORT`
- `APP_ENV`
- `DATABASE_URL`
- `DIRECT_URL`
- `SHADOW_DATABASE_URL`
- `CORS_ORIGIN`
- `FRONTEND_ORIGIN`
- `VULN_RADAR_API_TOKEN`
- `NVD_API_KEY`

## 운영 watchlist 입력 방식

운영에서 실데이터 ingest를 쓰려면 데모용 `db:seed` 대신
`watchlistEntry`만 별도로 넣는 편이 안전하다.

현재 repo에는 운영용 watchlist JSON 포맷과 upsert 스크립트가 있다.

- example JSON
  - `config/watchlist.entries.example.json`
- 실제 비공개 파일
  - `config/watchlist.entries.json`
- upsert script
  - `pnpm --filter vuln-radar-backend watchlist:upsert`

파일 포맷은 아래처럼 단순하다.

```json
{
  "version": 1,
  "entries": [
    { "type": "vendor", "value": "microsoft", "enabled": true },
    { "type": "product", "value": "kubernetes", "enabled": true },
    { "type": "ecosystem", "value": "npm", "enabled": true },
    { "type": "keyword", "value": "auth bypass", "enabled": true }
  ]
}
```

주의:

- `db:seed`는 demo vulnerability/advisory/epss/alert까지 같이 넣는다.
- 운영에서는 `watchlist:upsert`로 관심 키워드만 먼저 넣고 `POST /api/ingest/sync`를 실행하는 흐름을 권장한다.
- 스크립트는 값을 trim + lowercase 정규화해서 upsert한다.
- 파일에 없는 기존 항목까지 비활성화하려면 `--disable-missing` 옵션을 쓴다.

### Prisma generate와 DB URL

- `prisma generate`는 실제 DB 접속이 필요한 명령은 아니지만, Prisma 7에서는 `prisma.config.ts`를 먼저 로드한다.
- 따라서 config 로딩 단계에서 `DATABASE_URL`이나 `DIRECT_URL`을 강제로 해석하다가 throw하면, generate도 같이 실패할 수 있다.
- 현재 backend는 이 차이를 반영해서:
  - runtime / migrate 성격 로직은 실제 DB URL을 엄격하게 요구
  - `prisma generate` 같은 build 단계는 fallback URL로 통과
    하도록 분리해뒀다.

## 왜 이 스택인가

이 backend는 단순 CRUD보다 아래 책임이 더 크다.

- NVD, CISA KEV, EPSS, OSV 같은 외부 소스 수집
- CVE 기준 정규화와 중복 제거
- watchlist 기준 매칭
- risk score 계산
- Slack / Discord / Telegram 알림
- `apps/vuln-radar`에 feed / summary / detail API 제공

이 구조는 `API 서버 + scheduler + queue worker` 경계가 중요해서, 현재 repo에서는 `NestJS + PostgreSQL + Redis` 조합이 가장 균형이 좋다.

## v0.1 범위

- 최근 신규/수정 CVE 수집
- CISA KEV 반영
- EPSS 보강
- watchlist 매칭
- P0/P1 알림 전송
- 프론트용 overview / feed / alerts API

## 목표 디렉터리 구조

아래 구조를 목표 상태로 사용한다.

```text
apps/vuln-radar-backend
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  ├─ config/
│  ├─ common/
│  │  ├─ dto/
│  │  ├─ guards/
│  │  ├─ filters/
│  │  ├─ interceptors/
│  │  └─ utils/
│  ├─ infra/
│  │  ├─ prisma/
│  │  ├─ redis/
│  │  ├─ queue/
│  │  └─ logger/
│  ├─ modules/
│  │  ├─ health/
│  │  ├─ ingest/
│  │  │  ├─ collectors/
│  │  │  │  ├─ nvd/
│  │  │  │  ├─ kev/
│  │  │  │  ├─ epss/
│  │  │  │  ├─ osv/
│  │  │  │  └─ kisa/
│  │  │  ├─ jobs/
│  │  │  └─ ingest.module.ts
│  │  ├─ vulnerabilities/
│  │  ├─ advisories/
│  │  ├─ watchlist/
│  │  ├─ scoring/
│  │  ├─ alerts/
│  │  └─ feeds/
│  └─ shared/
│     ├─ schemas/
│     ├─ constants/
│     └─ types/
├─ test/
├─ README.md
└─ README-ADVICE.md
```

## 모듈 역할

### `health`

헬스체크와 기본 상태 확인용 모듈이다.
현재 실제 코드도 이 구조로 첫 정리를 시작했다.

### `ingest`

외부 데이터 소스를 수집하는 계층이다.

- `nvd`
- `kev`
- `epss`
- `osv`
- `kisa`

각 collector는 `raw fetch -> parse -> normalize input`까지만 책임진다.

### `vulnerabilities`

CVE 중심 엔티티와 조회 API를 담당한다.

- CVE 기본 정보
- CVSS
- published / modified time
- related products

### `advisories`

KEV, OSV, 벤더 공지, 한국어 공지 같은 `보강 정보`를 다룬다.

### `watchlist`

사용자 관심사 기준 매칭 조건을 관리한다.

- vendor
- product
- ecosystem
- keyword

현재는 운영용 admin API도 제공한다.

- `GET /api/admin/watchlist`
- `POST /api/admin/watchlist`
- `PATCH /api/admin/watchlist/:id`
- `DELETE /api/admin/watchlist/:id`

### `scoring`

위험도 계산의 핵심이다.

- KEV
- EPSS
- CVSS
- watchlist match
- RCE / auth bypass / public PoC

이 모듈이 최종 `priority: P0 ~ P3`를 계산한다.

### `alerts`

전송 채널과 알림 이력을 관리한다.

- Telegram
- Discord
- Slack

### `feeds`

프론트에서 소비하는 요약 API를 제공한다.

- `/api/overview`
- `/api/feed`
- `/api/kev`
- `/api/alerts`
- `/api/watchlist`

## API 원칙

- 외부 raw payload는 그대로 프론트에 노출하지 않는다.
- 모든 응답은 backend에서 정규화한 도메인 모델로 반환한다.
- 실시간 갱신은 `SSE`를 우선 검토한다.
- 비싼 수집 작업은 request-response에서 직접 실행하지 않는다.

## 저장소 원칙

기본은 `PostgreSQL`이다.

- 정규화 테이블 + raw JSON 저장을 함께 가져간다.
- watchlist, alert history, score history 관리가 쉽다.
- 이후 full-text 검색이 부족하면 그때 `OpenSearch`를 붙인다.

## 현재 시작점

현재 코드 기준 첫 정리는 다음 상태다.

- generic `AppController/AppService` 제거
- `src/config`에서 앱 env와 포트, frontend origin 정리
- `src/bootstrap/app-bootstrap.ts`로 global prefix와 CORS 적용
- `src/modules/health`로 상태 확인 엔드포인트 제공
- `prisma/schema.prisma`에서 vulnerability, advisory, epss, watchlist, alert 기본 스키마 정의
- `prisma.config.ts`로 Prisma 7 datasource 설정 분리
- `prisma/seed.ts`에서 demo DB 데이터 입력 경로 제공
- `src/modules/feeds`에서 `/api/overview`, `/api/feed`, `/api/watchlist`, `/api/alerts` DB 우선 fallback read-model 제공
- `src/modules/ingest`에서 NVD, KEV, EPSS pull sync를 수동 또는 자동 주기로 실행할 수 있음

이 다음 단계로는 `ingest`, `vulnerabilities`, `scoring` 순서로 확장하는 걸 추천한다.

## 온보딩 문서

- `docs/001_nest_structure_and_request_flow.md`
  - 왜 현재 구조를 이렇게 나눴는지
  - `/api/feed` 같은 요청이 Nest 내부에서 어떻게 흐르는지
- `docs/002_live_ingest_and_polling.md`
  - 어떤 upstream source를 실제로 읽는지
  - 왜 현재 구조를 polling / near-real-time으로 보는지
  - live sync와 freshness를 어떻게 확인하는지
- `docs/003_watchlist_admin_api.md`
  - 운영에서 watchlist를 어떻게 CRUD하는지
  - 왜 JSON upsert보다 admin API를 기본 경로로 선택했는지

## 실시간 데이터에 대한 현재 기준

- 현재 upstream source는 `push`가 아니라 `pull` 기반이다.
- 즉, “실시간 조회 API”는 존재하지만 대부분 polling 방식이다.
- 현재 backend는 아래 ingest 관측/수동 동기화 엔드포인트를 제공한다.
  - `GET /api/ingest/sources`
  - `GET /api/ingest/status`
  - `POST /api/ingest/sync`
- 자동 sync는 env로 제어한다.
  - `INGEST_SCHEDULER_ENABLED=true`
  - `INGEST_SYNC_INTERVAL_MINUTES=60`
  - `INGEST_SYNC_ON_STARTUP=false`
