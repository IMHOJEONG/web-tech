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

## 기본 포트

- frontend: `3000`
- backend: `4000`

개발 중 프론트는 `/api/backend/*`만 호출하고, 실제 backend origin 매핑은 프론트의 proxy 계층이 담당한다.

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
- `src/modules/feeds`에서 `/api/overview`, `/api/feed`, `/api/watchlist`, `/api/alerts` mock read-model 제공

이 다음 단계로는 `ingest`, `vulnerabilities`, `scoring` 순서로 확장하는 걸 추천한다.
