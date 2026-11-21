# JavaScript 현대화 4곳 실제 적용과 회귀 검증

## 대상과 조건

- 검증일: 2026-11-21 KST. 통합 실행은 11:02:23–11:03:35 KST이며 세부 UTC 시각은 artifact를 따른다.
- 기준: `feature/modern-web-guidance`, HEAD `c6465f48c96aef681a42de77a584b25e69fd8525` + 미커밋 작업 트리.
- 환경: Node 24.22.1, TypeScript 6.0.3, pnpm 12.14.0, Chromium 151.0.7922.34, 로컬 `postgres:16-alpine` 임시 DB.
- 범위: timeout 1곳·배열 1곳·Promise 2곳의 실제 교체, 해당 Node 타입 선언, 경로 계약 회귀 보강과 실제 클라이언트 브라우저 검사.
- 추적: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83), [Confluence 지식 입구](https://web-tech-service.atlassian.net/wiki/pages/19464193).

전날의 [분석·합성 검증](2026-11-20-modern-javascript-guidance.md)과 별도 실행이다. 기존 사용자 수정·미추적 문서를 보존했고 스테이징·커밋·푸시·배포는 하지 않았다.

## 재현 방법

저장소 루트에서 workspace 의존성, Docker Desktop과 로컬 PostgreSQL 이미지, Playwright Chromium이 필요하다. 실제 서비스의 DB·수집 API·운영 자격 증명은 사용하지 않는다.

```sh
pnpm --filter vuln-radar typecheck
pnpm exec tsc -p tsconfig.vuln-integration.json
pnpm exec tsc -p tsconfig.private-content-ci.json
node --experimental-strip-types --test scripts/private-content-ci.test.mts scripts/analyze-vuln-radar-lockfile.test.mts scripts/verification-cleanup.test.mts
pnpm --filter vuln-radar test:lib
pnpm --filter vuln-radar lint
node scripts/verify-vuln-radar-api-client.mjs
pnpm verify:vuln-radar:integration
node scripts/verify-modern-javascript-guidance.mjs
```

[API 클라이언트 검사](../../../scripts/verify-vuln-radar-api-client.mjs)는 실제 `client.ts`와 Zod를 임시 ES 모듈로 번들하고 loopback HTTP fixture에 Chromium의 native fetch로 요청한다. 성공·503·스키마 불일치·잘못된 JSON·연결 중단과 헤더/본문 대기 timeout을 확인한다. timeout 두 조건은 타이머를 가속하지 않고 실제 8초를 기다린다.

[전체 통합 검사](../../../scripts/verify-vuln-radar-integration.mts)는 임시 Postgres·Nest build·production Vite build/preview·실제 프록시와 브라우저를 사용한다. 자기 실행이 만든 자원만 정리한다. 샌드박스에서는 loopback·브라우저·Docker 소켓 권한이 필요해 승인된 실행으로 수행했다. Docker가 꺼져 있어 시작한 뒤 검사했으며 daemon 종료는 다른 작업에 영향을 줄 수 있어 수행하지 않았다.

## 결과와 증거

### 실제 변경

| 대상                    | 변경                                                                               | 보존한 계약                                               |
| ----------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `client.ts`             | `AbortSignal.timeout(API_TIMEOUT_MS)` 직접 전달, 수동 컨트롤러·타이머·finally 제거 | 8초, GET·Accept·URL 정규화·HTTP/스키마 검사·ApiError 분류 |
| `assertPrivateSearch()` | `routes.toSorted()`, 입력을 `readonly string[]`로 표현                             | 원본 순서·중복 개수·누락/외부/오래된 경로 거절            |
| 재시도 gate             | `Promise.withResolvers<void>()`로 대기/해제 선언                                   | 클릭 직전 hold 활성화·disabled 확인 후 해제·finally 해제  |
| 보조 API gate           | 같은 표준 API로 선언, 불필요한 `!`·`?.` 제거                                       | 보조 API만 대기·전체 장애/복구·정리 범위                  |
| Node 검사 설정 2개      | 각각 `ES2024.Promise`, `ES2023.Array` 선언 추가                                    | 공통 `target: ES2022`·공통 lib와 다른 앱 설정 유지        |

오탐인 [Set 직렬화](../../../scripts/analyze-vuln-radar-lockfile.mts)는 그대로 유지했다. 이 파일과 공통 TypeScript base의 bytes가 HEAD와 동일한지 확인했다. [정제 증거](../artifacts/2026-11-21-modern-javascript-implementation.json)의 `unchanged`, `sources`가 근거다.

### 실행 결과

| 검사                                        | 결과               | 의미와 한계                                             |
| ------------------------------------------- | ------------------ | ------------------------------------------------------- |
| 앱·통합·비공개 콘텐츠 CI 타입 검사          | 3진입점 통과       | 실제 수정 파일과 소비 진입점 검사                       |
| 경로·lockfile·정리 회귀                     | 46개 통과          | 동결한 역순 입력 비교·원본 보존과 기존 음성 조건 포함   |
| 앱 모델·패널 회귀                           | 36개 통과          | 오류·캐시·수치·상태 계약                                |
| 앱 lint                                     | 통과               | 기존 앱 범위·경고 0 기준                                |
| 실제 API 클라이언트 Chromium                | 7조건 통과         | HTTP/파싱/네트워크 오류와 실제 timeout                  |
| 전체 Postgres·Nest·production Vite·브라우저 | 26그룹 통과        | 1280/390px 재시도·지연·캐시·장애·복구와 실제 build 포함 |
| 통합 실행 정리                              | 6단계 통과, 오류 0 | 브라우저·두 서버·DB 연결·자기 컨테이너·임시 파일 정리   |
| 기존 합성 의미·타입 비교                    | 16조건 통과        | 표준 API의 일반 의미에 대한 보조 증거                   |

헤더 대기는 8009ms, 부분 본문 대기는 8016ms에 실패했다. 두 경우 신호 이유는 `TimeoutError`, 외부 오류는 `ApiError`, 분류는 `network`, 상태는 `null`이었다. 정확한 8000ms 스케줄링이나 원래 오류 메시지의 동일성을 보장한 결과는 아니다. GET·Accept·양쪽 slash 정규화와 정상 응답, HTTP 503의 `http`, 스키마 불일치의 `parse` 분류도 확인했다.

통합 검사에서는 교체한 두 gate가 실제 route handler의 대기와 함께 실행됐다. 재시도 버튼 disabled·소유 API만 refetch·느린 보조 API 분리·전체 장애 후 복구가 통과했다. 실행 artifact의 runner SHA-256과 실제 스크립트 해시를 비교했다. API 검사도 실행한 클라이언트 해시를 현재 파일과 대조했다.

### 초기 실패와 복구

- 교체 직후 통합 진입점은 `withResolvers` 진단 2550 두 건, 비공개 콘텐츠 CI 진입점은 배열 메서드 선언 부족과 그에 따른 콜백 타입 진단으로 실패했다. 필요한 lib를 각 Node 진입점에만 추가한 뒤 실제 전체 진입점 검사가 통과했다. 이번에는 격리 실험만으로 타입 실패를 추정한 것이 아니다.
- 첫 API 검사 실행은 샌드박스에서 서버를 시작하지 못했고 정리 과정의 `ERR_SERVER_NOT_RUNNING`이 원래 오류를 가렸다. `server.listening` 조건으로 정리 범위를 바로잡은 뒤 승인된 로컬 서버·브라우저 실행에서 7조건이 통과했다. 최초 실패를 제품 회귀로 분류하지 않는다.
- Docker는 처음에 daemon이 없었고 시작 후 sandbox의 소켓 접근이 거절됐다. 승인된 통합 실행에서 전체 검사와 자기 자원 정리를 완료했다.

### 증거 보관

검토 소스 해시·판정·API 관측값·통합 그룹·정리 결과는 [정제 JSON](../artifacts/2026-11-21-modern-javascript-implementation.json)에 보관했다. 원시 통합 JSON·스크린샷 10개와 API/의미 검사 출력은 저장소 밖 비공개 로컬 보관소에 보존했다. 다른 작업의 artifact는 이동하지 않았다. 인증값·실제 원고·원시 응답 전문은 정제 문서에 포함하지 않는다.

작업 트리 view로 기존 문서 `validate()`를 호출해 문서·artifact 11개의 구조·상대 링크·목차 오류 0건을 확인했다. 선택한 코드·설정·문서 18파일의 Prettier와 `git diff --check`가 통과했다. 정제 증거에 기록한 9소스의 현재 해시 일치와 인덱스 미변경도 확인했다. 인덱스만 읽는 staged 검사를 미커밋 문서 검증으로 대신하지 않았다.

Confluence의 기존 주제 3개와 상위 지식은 게시 버전 3의 적용 상태·검토일·검증 범위를 재조회했다. 원래 주제 링크를 보존했고 각 주제의 ancestors에서 운영 안내 → 웹 현대화 판단의 탐색 경로도 확인했다. 이번 코드의 원격 링크는 미푸시이므로 만들지 않았다.

### 최신 main 기준 공개 PR 후보 재검증

사용자 공개·커밋·푸시·PR 요청 후 최신 main `2cf837f04954d05d5ff409bdec6794ec28fd7f07`의 별도 worktree에 이번 변경만 옮겼다. 해당 Node 타입 3진입점·관련 46개·앱 36개·API Chromium 7조건·통합 26그룹·정리 6단계·의미 비교 16조건·앱 lint가 다시 통과했다. 변경 코드와 실제 실행 source/runner 해시는 초기 구현 증거와 일치한다. 재검증 집계는 정제 JSON의 `prCandidate`에 기록했으며 원시 자료는 공개 범위에서 제외했다.

## 한계와 후속 작업

- 로컬 코드·검사 결과이며 Git 원격·main·운영 배포 반영은 없다. 실제 새 변경의 원격 링크를 만들지 않는다.
- 실제 Chromium을 확인했지만 Safari·Firefox·모바일 실기기·bfcache 정지 상태는 이번 실행 범위 밖이다.
- timeout 신호의 원래 오류 이유·메시지는 수동 abort와 다를 수 있다. 코드 분류는 유지했고 문자열 동일성은 계약으로 추가하지 않았다.
- 성능·메모리 개선을 측정하지 않았다. 이번 변경의 목적은 표준 API로 관리 코드와 외부 가변 선언을 줄이는 것이다.
- 통합 검사는 임시 데이터와 로컬 서비스를 사용한다. 실제 수집·운영 DB·운영 네트워크의 상태를 보증하지 않는다.

## 관련 문서

- [시간 제한·취소 원리와 현재 적용](../../knowledge/infra-tooling/javascript-abort-timeout.md).
- [배열·Set 판단과 현재 적용](../../knowledge/infra-tooling/javascript-copying-arrays.md).
- [Promise gate 원리와 현재 적용](../../knowledge/infra-tooling/javascript-promise-with-resolvers.md).
- [실제 적용 작업 기록](../../worklog/2026-11/2026-11-21-modern-javascript-implementation.md).
- [ADR-0017: 패널별 장애 격리](../../architecture/adr-0017-vuln-radar-panel-failure-isolation.md). 이번 변경은 기존 격리·재시도·8초 제한 결정을 유지한다.
