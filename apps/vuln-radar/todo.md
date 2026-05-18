# vuln-radar todo

이 문서는 `apps/vuln-radar`를 만들면서 프론트엔드 관점에서 무엇을 구현하고, 무엇을 깊게 공부해야 하는지 정리한 학습용 TODO다.

## 1. 앱 부트스트랩 다시 세우기

- [x] `Next -> Vite` 전환 범위를 최종 확정한다.
- [x] `src/app/main.tsx`, `src/app/App.tsx` 기준의 최소 앱 엔트리를 만든다.
- [x] `TanStack Router`와 `TanStack Query`를 초기 provider에 연결한다.
- [x] env 파싱 위치와 런타임 config 방식을 정한다.

결정 메모:

- `Next` App Router, `next.config.mjs`, `next-env.d.ts`, `next-auth` 타입 파일은 부트스트랩 전환 범위에서 제거한다.
- 브라우저 공개 API path는 계속 `/api/backend/*`로 유지한다.
- 실제 백엔드 origin 연결은 `vite.config.ts`의 `server.proxy`와 `VULN_RADAR_BACKEND_ORIGIN`이 맡는다.
- 클라이언트에서 읽는 런타임 값은 `src/shared/config/env.ts`에서 `VITE_*`만 파싱하고 `runtime.ts`로 노출한다.

공부 포인트:

- [ ] Vite가 Next보다 단순한 이유를 설명할 수 있다.
- [ ] CSR 앱에서 라우터, 쿼리 캐시, 전역 provider가 어떤 순서로 올라가는지 이해한다.
- [ ] `server.proxy`가 왜 CORS를 줄여주는지 설명할 수 있다.

## 2. 폴더 구조를 실제 코드로 바꾸기

- [ ] `src/app`
- [ ] `src/pages`
- [ ] `src/widgets`
- [ ] `src/features`
- [ ] `src/entities`
- [ ] `src/shared`

공부 포인트:

- [ ] FSD를 “이론”이 아니라 현재 앱에 맞게 왜 이렇게 자르는지 설명할 수 있다.
- [ ] `pages`와 `widgets`의 차이를 예시로 말할 수 있다.
- [ ] `entities`와 `features`를 헷갈리지 않고 나눌 수 있다.

## 3. 공용 API 클라이언트 만들기

- [ ] `shared/api/client.ts`를 만든다.
- [ ] 기본 base URL 전략을 `/api/backend` 기준으로 고정한다.
- [ ] timeout, retry, error normalization 규칙을 정한다.
- [ ] health check 호출 함수를 가장 먼저 붙인다.

공부 포인트:

- [ ] `ky` 또는 `fetch wrapper`를 왜 쓰는지 이해한다.
- [ ] UI에서 raw HTTP error를 바로 다루지 않고 adapter를 두는 이유를 설명할 수 있다.
- [ ] 프론트에서 API path를 하드코딩할 때 생기는 유지보수 비용을 이해한다.

## 4. 첫 엔티티 만들기: `cve`

- [ ] `entities/cve/api`
- [ ] `entities/cve/model`
- [ ] `entities/cve/ui`
- [ ] `entities/cve/lib`

공부 포인트:

- [ ] CVE 응답을 “서버 모델”과 “화면 모델”로 분리하는 이유를 설명할 수 있다.
- [ ] published / modified / severity / score 같은 필드를 어떤 타입으로 다루는지 정리한다.
- [ ] `zod`로 response schema를 검증하는 흐름을 익힌다.

## 5. 두 번째 엔티티 만들기: `advisory`

- [ ] KEV, OSV, vendor advisory를 같은 카드 모델로 묶을지 결정한다.
- [ ] `KEV`, `EPSS`, `CVSS`, `PoC` 같은 badge 표현 규칙을 정한다.
- [ ] advisory source별 아이콘/색/강조 기준을 정한다.

공부 포인트:

- [ ] 서로 다른 소스를 같은 UI에 녹일 때 어떤 정규화가 필요한지 이해한다.
- [ ] source identity와 severity identity를 분리해서 디자인할 수 있다.

## 6. overview 페이지 만들기

- [ ] 오늘의 P0/P1 요약 카드
- [ ] 최근 수정 CVE 리스트
- [ ] KEV 추가 항목 요약
- [ ] watchlist match count

공부 포인트:

- [ ] 대시보드 첫 화면에서 “무엇을 제일 먼저 보여줘야 하는가”를 설명할 수 있다.
- [ ] 정보가 많을 때 summary > list > detail 순서가 왜 중요한지 이해한다.

## 7. feed 페이지 만들기

- [ ] 시간순 피드
- [ ] priority 필터
- [ ] source 필터
- [ ] keyword 검색

공부 포인트:

- [ ] 필터 상태를 URL query string으로 둘지 local state로 둘지 판단할 수 있다.
- [ ] 테이블과 카드 중 어떤 표현이 더 맞는지 기준을 세울 수 있다.

## 8. watchlist 페이지 만들기

- [ ] vendor 목록
- [ ] product 목록
- [ ] ecosystem 목록
- [ ] keyword 목록
- [ ] watchlist 편집 UI

공부 포인트:

- [ ] watchlist가 왜 `제품 관리`가 아니라 `우선순위 판단 장치`인지 이해한다.
- [ ] 사용자 입력 모델과 백엔드 저장 모델이 다를 수 있다는 점을 이해한다.

## 9. alert 페이지 만들기

- [ ] 최근 전송 알림 목록
- [ ] priority별 묶음
- [ ] 전송 채널별 구분
- [ ] unread / acknowledged 상태 표현

공부 포인트:

- [ ] 알림은 이벤트 로그인지 작업 큐인지 개념을 구분할 수 있다.
- [ ] alert feed와 vulnerability feed가 왜 다른지 설명할 수 있다.

## 10. SSE 연결 붙이기

- [ ] 브라우저에서 SSE 구독 유틸 만들기
- [ ] feed 갱신 규칙 설계
- [ ] reconnect 정책 정의
- [ ] stale data 처리 기준 정의

공부 포인트:

- [ ] polling, SSE, WebSocket 차이를 설명할 수 있다.
- [ ] 현재 앱에서 왜 SSE를 우선 추천하는지 설명할 수 있다.

## 11. 에러/로딩 UX 정리

- [ ] route level loading
- [ ] widget level skeleton
- [ ] empty state
- [ ] API failure state

공부 포인트:

- [ ] “데이터 없음”과 “에러”와 “로딩 중”을 확실히 구분할 수 있다.
- [ ] 운영 도구형 앱에서 과한 animation보다 빠른 피드백이 더 중요한 이유를 이해한다.

## 12. 디자인 시스템 최소 기준 세우기

- [ ] typography scale
- [ ] severity color scale
- [ ] badge/token naming
- [ ] card/table spacing rule

공부 포인트:

- [ ] `CVSS`, `EPSS`, `KEV`, `P0~P3`를 시각적으로 어떻게 구분해야 혼동이 줄어드는지 설명할 수 있다.
- [ ] 정보 밀도가 높은 도구형 앱에서 색을 절제해야 하는 이유를 이해한다.

## 13. 테스트 기준 세우기

- [ ] API adapter 단위 테스트
- [ ] entity mapper 테스트
- [ ] 최소 페이지 렌더 테스트

공부 포인트:

- [ ] 프론트에서 가장 먼저 테스트해야 하는 것은 컴포넌트보다도 데이터 변환 로직이라는 점을 이해한다.

## 14. 최종 학습 체크

- [ ] 프론트가 왜 외부 취약점 소스를 직접 호출하면 안 되는지 설명할 수 있다.
- [ ] 이 앱의 최종 공개 API path 규칙을 설명할 수 있다.
- [ ] 왜 `Vite + Router + Query + SSE` 조합이 현재 문제에 맞는지 설명할 수 있다.
- [ ] 현재 화면 구조가 `overview / feed / watchlist / alerts`로 나뉜 이유를 설명할 수 있다.
