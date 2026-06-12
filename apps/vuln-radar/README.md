## `apps/vuln-radar`

`apps/vuln-radar`는 개인용 `Global Vuln Radar` 프론트엔드다.
목표는 전세계 취약점 피드를 그대로 보여주는 것이 아니라, `내 관심 기술 기준으로 오늘 위험한 취약점만 빠르게 찾는 Vite 기반 대시보드`를 만드는 것이다.

## 제품 목표

- 빠른 프론트엔드 개발 속도
- 취약점 우선순위 판단에 맞는 정보 구조
- 백엔드와의 명확한 책임 분리
- feed, watchlist, alert, score 흐름의 단순화

## v0.1 범위

- 최근 신규/수정 CVE 표시
- CISA KEV 포함 여부 표시
- EPSS 기반 악용 가능성 표시
- watchlist 벤더/제품 매칭
- P0/P1 알림 이력과 일일 요약

## 권장 스택

- `Vite`
- `React`
- `TypeScript`
- `TanStack Router`
- `TanStack Query`
- `shadcn/ui`
- `Sass` 또는 `Tailwind + design tokens`
- `SSE` 우선, 필요 시 `WebSocket`

## 데이터 소스 관점

프론트는 아래 소스를 직접 수집하지 않고, 백엔드가 정규화한 결과만 소비한다.

- `NVD`: 신규/수정 CVE
- `CISA KEV`: 실제 악용된 취약점
- `EPSS`: 악용 가능성 점수
- `OSV`: 오픈소스 패키지 취약점
- `KISA/보호나라`: 한국 맥락 공지

## 디렉터리 설계

아래 구조를 목표 상태로 사용한다.

```text
apps/vuln-radar
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ providers/
│  │  ├─ router/
│  │  ├─ styles/
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ pages/
│  │  ├─ overview/
│  │  ├─ feed/
│  │  ├─ kev/
│  │  ├─ packages/
│  │  ├─ watchlist/
│  │  ├─ alerts/
│  │  └─ settings/
│  ├─ widgets/
│  │  ├─ radar-summary/
│  │  ├─ vuln-feed/
│  │  ├─ kev-changes/
│  │  ├─ package-impact/
│  │  └─ alert-summary/
│  ├─ features/
│  │  ├─ change-time-range/
│  │  ├─ filter-priority/
│  │  ├─ edit-watchlist/
│  │  ├─ select-ecosystem/
│  │  └─ acknowledge-alert/
│  ├─ entities/
│  │  ├─ cve/
│  │  │  ├─ api/
│  │  │  ├─ model/
│  │  │  ├─ ui/
│  │  │  └─ lib/
│  │  ├─ advisory/
│  │  ├─ watchlist/
│  │  ├─ alert/
│  │  └─ package-risk/
│  ├─ shared/
│  │  ├─ api/
│  │  ├─ config/
│  │  ├─ lib/
│  │  ├─ model/
│  │  ├─ ui/
│  │  ├─ styles/
│  │  └─ types/
│  └─ assets/
├─ docs/
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 레이어 설명

### `src/app`

앱 부트스트랩 영역이다.

- `main.tsx`: Vite entry
- `App.tsx`: 최상위 앱 컴포넌트
- `providers/`: QueryClientProvider, theme, error boundary
- `router/`: TanStack Router 설정
- `styles/`: 전역 스타일, 토큰, 리셋

### `src/pages`

라우트 단위 화면 조립 레이어다.
페이지는 데이터 수집 로직보다 `무슨 시각화와 필터를 보여줄지`에 집중한다.

- `overview`: 오늘의 P0/P1 레이더
- `feed`: 신규/수정 CVE 흐름
- `kev`: KEV 추가/변경 추적
- `packages`: 오픈소스 생태계 영향도
- `watchlist`: 관심 제품군 상태
- `alerts`: 전송 이력과 미처리 항목
- `settings`: watchlist, 채널, 임계값 설정

### `src/widgets`

페이지 안에서 재사용되는 큰 화면 블록이다.
점수 카드, 테이블, 타임라인, 요약 패널을 이 레이어에 둔다.

- `radar-summary`
- `vuln-feed`
- `kev-changes`
- `package-impact`
- `alert-summary`

### `src/features`

사용자 액션 중심 기능을 둔다.

- `change-time-range`
- `filter-priority`
- `edit-watchlist`
- `select-ecosystem`
- `acknowledge-alert`

### `src/entities`

도메인 단위 모델과 뷰 조각을 둔다.
백엔드 응답을 그대로 쓰지 말고 화면 친화적 형태로 가공한다.

- `cve`
- `advisory`
- `watchlist`
- `alert`
- `package-risk`

각 엔티티는 보통 이런 하위 구조를 가진다.

```text
entities/cve/
├─ api/
├─ model/
├─ ui/
└─ lib/
```

### `src/shared`

순수 재사용 기반 코드를 둔다.

- `api`: HTTP client, interceptors, SSE helpers
- `config`: env parser, runtime config
- `lib`: date, score, severity, tag helpers
- `model`: 공용 schema, pagination, filter type
- `ui`: Button, Card, Badge, DataTable
- `styles`: tokens, mixins
- `types`: 공용 타입

## 라우팅 원칙

도구형 앱으로 보고 라우트는 얕고 명확하게 유지한다.

- `/`
- `/overview`
- `/feed`
- `/kev`
- `/packages`
- `/watchlist`
- `/alerts`
- `/settings`

상세 drill-down은 쿼리 파라미터와 패널 전환으로 우선 처리한다.

## 데이터 패칭 원칙

`apps/vuln-radar`는 외부 벤더 API를 직접 호출하지 않는다.
모든 데이터 요청은 `apps/vuln-radar-backend`를 통한다.

예시 흐름:

1. `shared/api/client.ts`에서 HTTP client 생성
2. `entities/*/api`에서 endpoint 함수 정의
3. `entities/*/model`에서 adapter와 query option 정의
4. `widgets`와 `pages`에서 조합

## 개발 실행 원칙

기본 권장 실행 방식은 프론트와 백엔드를 함께 띄우는 것이다.

- 프론트만: `pnpm dev:vuln-radar`
- 백엔드만: `pnpm dev:vuln-radar-backend`
- 둘 다: `pnpm dev:vuln-radar:full`

공개 경로 규칙은 이렇게 유지한다.

- backend route: `/api/backend/*`

현재 프론트는 `vite.config.ts`의 `server.proxy`가 `/api/backend/*`를 `http://localhost:4000/api/*`로 프록시한다.
즉, 브라우저 공개 경로는 유지하고 실제 목적지 연결만 Vite 개발 서버가 맡는다.

## Turbo env 관리

Turbo 환경변수 선언은 root `turbo.json`에 몰아넣지 않고 앱별로 관리한다.

- `apps/vuln-radar/turbo.json`
  - `VULN_RADAR_BACKEND_ORIGIN`
  - `VULN_RADAR_BACKEND_API_TOKEN`
- `VITE_*`
  - Vite framework inference로 Turbo가 패키지 단위로 자동 추적한다.

즉, 이 앱 전용 env를 추가할 때는 가능하면 root `globalEnv`가 아니라 `apps/vuln-radar/turbo.json`부터 갱신한다.

## 운영 프록시 기준

로컬 개발과 운영 배포는 같은 공개 경로를 유지하되, 프록시 계층만 다르게 둔다.

- local dev
  - `vite.config.ts`의 `server.proxy`
- Vercel production
  - `vercel.json`
  - `api/proxy/[...path].ts`

즉, 브라우저는 계속 `/api/backend/*`만 호출하고, Vercel 배포에서는 proxy function이 `VULN_RADAR_BACKEND_ORIGIN`을 읽어 `${backendOrigin}/api/*`로 전달한다.
backend가 server-to-server Bearer 인증을 요구하면 `VULN_RADAR_BACKEND_API_TOKEN`을 읽어 `Authorization: Bearer <token>` 헤더도 같이 주입한다.

## 관련 문서

- `docs/003_dev-runtime.md`
  - 프론트/백엔드 로컬 실행 전략
  - Vite proxy와 backend 연결 방식
- `docs/005_vercel_proxy_debugging.md`
  - Vercel 운영 프록시 디버깅
  - direct backend / vercel proxy 비교 순서
  - Function Logs 해석 기준
- `docs/004_workspace_install_and_typescript_recovery.md`
  - `@web-tech/ui prebuild` 실패 복구
  - `@web-tech/typescript-config/react-library` 미해석 복구
  - workspace 설치/타입 해석 장애 재발 대응

## 실시간 데이터 원칙

실시간 처리도 화면 성격에 맞게 나눈다.

- feed 갱신: `SSE` 우선
- alert 갱신: `SSE` 또는 짧은 polling
- 양방향 제어가 필요할 때만 `WebSocket`

프론트는 스트림 연결과 렌더링만 맡고, fan-out과 이벤트 생성은 백엔드가 맡는다.

## 우선 엔티티

문서 `docs/001_find.md`, `docs/002_data.md` 기준으로 첫 엔티티는 이렇게 잡는다.

- `cve`: CVE 기본 정보, CVSS, 게시/수정 시각
- `advisory`: KEV, OSV, 벤더 공지, KISA 공지
- `watchlist`: vendor, product, ecosystem, keyword
- `alert`: priority, channel, sent status
- `package-risk`: npm, PyPI, Maven, Go 등 ecosystem 영향도

## 위험도 표시 기준

점수 계산 자체는 백엔드 책임이지만, 프론트는 아래 신호를 일관되게 보여줘야 한다.

- `KEV`
- `EPSS`
- `CVSS`
- `watchlist match`
- `RCE / auth bypass / public PoC`
- `priority: P0 ~ P3`

## 현재 구조에서 옮길 대상

다음 항목은 새 구조로 재배치한다.

- `components/charts/network-timeline` -> `src/widgets/radar-summary` 또는 `src/widgets/vuln-feed`
- `components/monitoring/flow-box.tsx` -> `src/widgets/radar-summary`
- `components/charts/ranking-top-box.tsx` -> `src/widgets/alert-summary` 또는 `src/widgets/package-impact`
- `feature/network/net-flow/api.ts` -> `src/entities/cve/api`
- `feature/ranking/top/api.ts` -> `src/entities/advisory/api`
- `components/ui/*` -> `src/shared/ui`
- `lib/*` -> `src/shared/lib`
- `shared/react-flow/*` -> `src/shared/ui`

## 제거 대상

Vite 전환 시 아래 구조는 제거 대상이다.

- `app/`
- `app/api/`
- `auth.ts`
- `next.config.mjs`
- `app/signin/`
- `app/(test)/`

## 메모

- Recharts는 CSR 중심으로 다루는 것이 안전하다.
- Feature-Sliced Design은 참고하되 과도한 분할은 피한다.
- 외부 데이터 소스 의존 로직은 프론트가 아니라 백엔드에 둔다.
- `새 CVE`보다 `우선순위가 높은 CVE`를 먼저 보이게 설계한다.
- 로컬 런타임 전략은 `docs/003_dev-runtime.md`를 기준으로 본다.
- legacy Next monitoring 코드는 제거된 상태이며, 현재는 최소 frontend shell만 유지한다.
