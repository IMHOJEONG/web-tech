## `apps/vuln-radar` 방향 메모

`apps/vuln-radar`는 단순한 모니터링 대시보드가 아니라 개인용 `Global Vuln Radar` 프론트엔드다.
핵심 목표는 `오늘 전세계에서 나온 취약점`이 아니라 `내 관심 기술 기준으로 지금 봐야 할 취약점`을 빠르게 보여주는 것이다.

## 제품 정의

이 앱은 아래 네 신호를 합쳐서 보여준다.

- 공개 신호: NVD, 벤더 권고, OSV, GHSA
- 위험도 신호: CVSS, EPSS, CISA KEV
- 악용 신호: 공개 PoC, 악용 언급, 관측 계층
- 영향도 신호: watchlist, ecosystem, 자산/패키지 매칭

즉, `새 CVE 피드`가 아니라 `우선순위가 정리된 취약점 레이더`가 목표다.

## 왜 Vite인가

현재 프론트는 공개 SEO 페이지보다 대시보드 성격이 훨씬 강하다.

- 차트, 표, 필터, drill-down이 중심이다.
- 서버 렌더링보다 빠른 상호작용과 개발 속도가 중요하다.
- 데이터 수집과 보강 로직은 `apps/vuln-radar-backend`로 분리하는 편이 자연스럽다.
- 실시간 이벤트, polling, alert feed 연결이 핵심 UX다.

이 조건에서는 Next보다 Vite의 장점이 더 크다.

- dev server와 HMR이 빠르다.
- 클라이언트 앱 구조가 단순하다.
- SSE, WebSocket, polling UI를 붙이기 쉽다.
- 프론트와 백엔드 경계를 명확하게 유지할 수 있다.

## 프론트의 책임

`apps/vuln-radar`는 아래 역할만 담당한다.

- 취약점 우선순위 대시보드 렌더링
- watchlist 기반 필터링 UI
- CVE 상세 drill-down
- KEV, EPSS, OSV 보강 결과 조회
- 알림 상태와 일일 요약 UI
- 실시간 이벤트 수신

`apps/vuln-radar`가 하지 않을 일:

- NVD, CISA, OSV 같은 외부 소스 직접 수집
- 스케줄링, 배치, 큐 처리
- risk score 계산의 최종 책임
- 장기 저장소 및 캐싱
- 알림 송신 로직의 최종 책임

위 책임은 `apps/vuln-radar-backend`로 이동한다.

## 추천 스택

- `Vite`
- `React`
- `TypeScript`
- `TanStack Router`
- `TanStack Query`
- `Zustand` 또는 작은 local store
- `SSE` 우선, 필요 시 `WebSocket`
- `shadcn/ui`
- `Recharts`

## 화면 방향

문서형 사이트가 아니라 운영 도구형 앱으로 본다.

- `/overview`: 오늘의 P0/P1 취약점
- `/feed`: 신규/수정 CVE 흐름
- `/kev`: CISA KEV 변경사항
- `/packages`: 오픈소스 패키지 영향도
- `/watchlist`: 관심 벤더/제품 기준 추적
- `/alerts`: 전송된 알림과 미처리 항목
- `/settings`: watchlist, 채널, 임계값 설정

## 데이터 흐름 원칙

1. 브라우저는 `apps/vuln-radar-backend`만 호출한다.
2. 백엔드는 NVD, KEV, EPSS, OSV 같은 외부 소스를 수집한다.
3. 백엔드는 정규화, 점수 계산, watchlist 매칭을 끝낸 결과를 전달한다.
4. 프론트는 표시와 조작에 집중하고, 소스별 수집 세부 구현을 모른다.

## 개발 연결 원칙

개발 환경에서 프론트와 백엔드는 `package dependency`로 묶지 않는다.

- `apps/vuln-radar`는 별도 프로세스
- `apps/vuln-radar-backend`는 별도 프로세스
- 연결은 `env + proxy`로 처리

현재 단계 기본값:

- 프론트: `http://localhost:3000`
- 백엔드: `http://localhost:4000`
- 프론트 공개 경로: `/api/backend/*`
- 실제 백엔드 origin: `VULN_RADAR_BACKEND_ORIGIN`

즉, 브라우저는 `/api/backend/...`만 알고, 실제 목적지 연결은 현재 Vite proxy가 맡는다.

## v0.1 우선순위

첫 버전은 아래 다섯 가지에 집중한다.

1. 최근 신규/수정 CVE 표시
2. CISA KEV 포함 여부 표시
3. EPSS 기반 악용 가능성 표시
4. watchlist 제품/벤더 매칭 표시
5. P0/P1 알림 이력 표시

## 마이그레이션 원칙

Next에서 Vite로 옮길 때는 프레임워크 API를 제거하는 순서로 간다.

- `app/` 제거
- `app/api/` 제거
- `next/dynamic` 제거
- `next/server`, `NextRequest`, `NextResponse` 제거
- `public/`, `components/`, `feature/`, `shared/`는 필요한 것만 재배치

## 구조 원칙

Feature-Sliced Design의 아이디어는 유지하되, `취약점 도메인`이 바로 드러나게 구성한다.

- `app`: 앱 부트스트랩, provider, router
- `pages`: 라우트 단위 화면
- `widgets`: feed, radar, summary 같은 조합 UI
- `features`: 필터 변경, watchlist 수정, 알림 확인 같은 사용자 액션
- `entities`: `cve`, `advisory`, `watchlist`, `alert`
- `shared`: 공용 API, UI, lib, types

상세 구조는 `README.md`를 기준으로 본다.
