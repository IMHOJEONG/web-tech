## `apps/vuln-radar-backend` 방향 메모

`apps/vuln-radar-backend`는 단순 CRUD API가 아니라 `Global Vuln Radar`의 수집, 정규화, 점수 계산, 알림을 담당하는 본체다.
핵심 목표는 많은 CVE를 저장하는 것이 아니라 `지금 봐야 할 취약점`을 빠르게 판별해 프론트에 전달하는 것이다.

## 지금 이 repo에서 추천하는 기술 스택

v0.1 기준으로는 `TypeScript + NestJS`를 유지하는 쪽을 추천한다.

- 현재 repo가 이미 TypeScript monorepo다.
- 프론트와 백엔드 타입/스키마를 맞추기 쉽다.
- API, scheduler, queue, module 분리가 한 프로젝트 안에서 자연스럽다.
- `apps/vuln-radar`와 협업할 때 문맥 전환 비용이 낮다.

## 권장 구성

- Runtime: `Node.js`
- Framework: `NestJS`
- Database: `PostgreSQL`
- ORM: `Prisma`
- Queue: `Redis + BullMQ`
- Scheduling: `@nestjs/schedule` 또는 BullMQ repeatable jobs
- Validation/Normalization: `zod`
- API transport: `REST` 우선, 실시간은 `SSE`
- Test: `Jest`

## 왜 이 조합이 맞는가

`vuln-radar-backend`는 아래 일을 해야 한다.

- NVD, CISA KEV, EPSS, OSV 수집
- CVE 기준 정규화
- watchlist 매칭
- risk score 계산
- 알림 전송
- 프론트용 feed / summary API 제공

이 작업은 웹 API만이 아니라 `수집기 + 잡 처리 + 집계` 성격이 강하다.
그래서 단순 Express 서버보다 `module + job + infra` 구분이 쉬운 Nest가 잘 맞는다.

## Python으로 가지 않는 이유

문서 기준으로 Python/FastAPI도 충분히 좋은 선택이다.
다만 현재 repo 맥락에서는 첫 버전부터 언어를 나누는 비용이 더 크다.

- frontend/backend 모두 TypeScript로 맞추기 쉽다.
- shared schema와 도메인 용어를 통일하기 좋다.
- monorepo 운영이 단순하다.

단, 이후 수집량이 커지거나 특정 collector가 CPU/IO 특화 요구가 생기면 그때 Python/Go sidecar를 분리하는 건 좋은 확장 방향이다.

## 데이터 저장소 선택

기본 DB는 `PostgreSQL`을 추천한다.

- JSONB와 정규화 테이블을 함께 쓰기 좋다.
- advisory 원문과 정규화 결과를 같이 저장하기 좋다.
- watchlist, alert, score 이력, 검색 조건을 다루기 편하다.

초기에는 `OpenSearch`, `Kafka`, `ClickHouse`까지 바로 넣지 않는다.
v0.1은 `PostgreSQL + Redis`면 충분하다.

## 우선순위

1. 수집기
2. 정규화
3. 점수 계산
4. watchlist 매칭
5. 알림
6. 프론트 API

즉, 먼저 `backend for dashboard`가 아니라 `decision engine for vuln radar`로 생각하는 게 맞다.
