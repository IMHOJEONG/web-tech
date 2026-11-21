# Modern Web Guidance JavaScript 5개 후보 재검증

## 대상과 조건

- 검증일: 2026-11-20 KST. 정확한 실행 시각은 artifact의 UTC `observedAt`을 따른다.
- 기준: `feature/modern-web-guidance`, HEAD `c6465f48c96aef681a42de77a584b25e69fd8525`와 로컬 작업 트리.
- 환경: Node `v24.22.1`, TypeScript `6.0.3`, 루트 pnpm workspace 의존성.
- 입력: 사용자가 제시한 저장소 루트 스캔의 5건. 이번에는 `legacy-scan`을 재실행하지 않았다.
- 범위: 실제 소스 4개 파일·발견 지점 5곳, 설정 4개 파일, 합성 동작·격리 타입 비교 16조건.
- 관리: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83), [웹 현대화 지식 입구](https://web-tech-service.atlassian.net/wiki/pages/19464193).

작업 시작 전 기존 변경·미추적 파일을 확인했다. 검토 대상 앱·정책·통합 스크립트와 공통 설정 8파일은 `git diff HEAD -- <대상 경로>`가 비어 있었고, 앱 API를 교체하지 않았다. 이 문서와 지식 문서·재현 검사는 로컬 미커밋이다. GitHub API에서 기준 커밋의 존재를 별도 확인했으며 새로운 문서의 원격 URL은 만들지 않았다.

## 재현 방법

저장소 루트에서 기존 workspace 의존성이 설치된 Node 24 환경으로 실행한다.

```sh
node scripts/verify-modern-javascript-guidance.mjs
```

이번 실행은 위 명령의 JSON 출력을 임시 파일로 받아 검토한 뒤 [정제 artifact](../artifacts/2026-11-20-modern-javascript-guidance.json)에 저장했다. 검사 코드는 [재현 스크립트](../../../scripts/verify-modern-javascript-guidance.mjs)에서 관리한다. 정상 종료 기준은 `passed: 16`, `failed: 0`, 종료 코드 0이다. 시간·환경·소스 해시는 실행마다 바뀔 수 있다.

검사는 외부 요청·로컬 서버·DB·앱 기동 없이 실행한다. fetch 예제는 이미 중단된 신호와 합성 `data:` URL만 사용한다. TypeScript 비교는 가상 소스와 `types: []`로 격리하며 파일·공통 설정을 쓰지 않는다. Node timeout의 프로세스 생존 여부는 짧은 별도 자식 프로세스로 확인한다.

소스 판정은 함수 전체와 타입 선언을 읽고 Modern Web Guidance `js`의 적용·제외 조건 및 WHATWG·ECMAScript 명세를 대조했다. 38개 가이드·전체 약 20%·591개 제외라는 수치는 제공된 출력의 설명이며 이번 검사에서 독립 재집계한 값은 아니다. 이전 KAN-83의 `apps/docs` 11건 스캔과도 합산하지 않는다.

## 결과와 증거

### 지점별 판정

행 번호는 사용자 입력 시점의 위치 식별자다. 이후 편집에서는 함수명·표현식으로 찾는다.

| 규칙·위치                                         | 판정             | 실제 근거                                                                                      |
| ------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| timeout · `client.ts:35`                          | 개선 후보 유지   | 컨트롤러는 8초 제한에만 사용. 현재 `finally` 정리도 존재하므로 누수 발견으로 해석하지 않음     |
| 배열 · `analyze-vuln-radar-lockfile.mts:116`      | 제외: 오탐       | `targets`는 `Set<string>`이며 spread는 필수 배열 변환                                          |
| 배열 · `private-content-ci-policy.mts:98`         | 선택적 개선 후보 | `routes: string[]`이며 기존 복사도 원본 보호. 왼쪽 map 결과의 sort는 입력 배열을 변경하지 않음 |
| Promise · `verify-vuln-radar-integration.mts:721` | 개선 후보 유지   | `holdRetry` executor는 외부 `release` 대입만 수행. 기존 가변 바인딩·finally 범위 보존 필요     |
| Promise · 같은 파일 `:868`                        | 개선 후보 유지   | 느린 보조 API를 gate로 보류하고 외부 해제. 새 API가 대기를 자동 해제하는 것은 아님             |

5건 중 4건은 개선 후보이고 1건은 제외한다. 이 분류는 확정 결함 4건이나 즉시 교체 승인으로 해석하지 않는다.

### 실행 결과

Node·격리 TypeScript 합성 검사 **16조건 통과, 실패 0, 종료 코드 0**. 상세 조건·관측값·8파일 SHA-256은 [artifact](../artifacts/2026-11-20-modern-javascript-guidance.json)의 `results`와 `sources`를 확인한다.

| 검증 묶음      | 조건 수 | 확인한 계약                                                                                                                            |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 취소·시간 제한 | 5       | AbortError/TimeoutError, 이미 중단된 신호의 fetch 거절, 첫 중단 이유 전달, 작업 완료 후 신호 만료, Node 단독 timeout으로 생존하지 않음 |
| 배열·검색      | 6       | 결과/원본 보존, Set 직접 호출 실패·변환 성공, map 결과 정렬, TypedArray 순서 차이, 희소 배열 슬롯, 역순 검색 인덱스·실패               |
| Promise        | 3       | executor 동기 대입, 해제 전 대기·중복 resolve, executor throw/rejection과 외부 setup 동기 throw 차이                                   |
| 격리 타입 선언 | 2       | ES2022 lib의 진단 2550 두 건과 ES2024 lib의 진단 0건; target은 모두 ES2022                                                             |

격리 ES2022 실험에서는 `toSorted`와 `withResolvers`만 진단이 나고 DOM 타입의 `AbortSignal.timeout`은 진단되지 않았다. 이는 내장 API가 언어 표준·DOM 타입 등 서로 다른 선언 경로를 사용한다는 사례다. 별도 ambient 타입이 있는 실제 프로젝트 전체의 컴파일 결과를 대신하지 않는다.

### 문서와 원격 기록 검사

문서 11개에 대해 인덱스를 변경하지 않는 작업 트리 view로 저장소의 기존 `validate()`를 호출해 구조·상대 링크·목차·artifact 검사 오류 0건을 확인했다. 관련 문서·JSON·스크립트 12개를 명시한 Prettier 검사와 `git diff --check`도 통과했다. `--staged` 검사 통과만으로 이 새 문서를 검증했다고 보고하지 않는다.

Confluence 주제 3개의 본문·코드 예제·근거 링크·재현 검사 경로와 상위 페이지의 연결을 게시 버전 2에서 재조회했다. 각 주제의 ancestors에는 운영 안내 `65817` → 상위 지식 `19464193` 경로가 포함됐다. Jira의 같은 작업 댓글 `10120`을 3열 표로 관리하며 최종 저장 확인은 작업 기록에 남긴다.

## 한계와 후속 작업

- 브라우저의 실제 timeout·bfcache·응답 본문 중단, 지원 브라우저 전체, 앱 retry 화면·네트워크 오류 회귀는 미검증이다.
- 이번 작업은 실제 앱·통합 스크립트의 API 교체나 전체 앱 빌드·E2E가 아니다. 성능·메모리 개선도 측정하지 않았다.
- 공통 `lib: es2022`는 확인했으나 실제 각 진입점에 교체 코드를 넣어 전체 타입 검사를 실행하지 않았다. 공통 설정을 바로 올려야 한다는 결론을 내리지 않는다.
- 최신 스캔 수를 새로 보증하지 않는다. 자동 분석 결과는 타입·호환성·생명주기를 대조해 판단해야 한다.
- 적용하려면 각 소비처의 오류 처리·정렬 계약·해제 순서를 보존한 별도 변경과 해당 경로 회귀 검사가 필요하다.

## 관련 문서

- [시간 제한과 취소 신호](../../knowledge/infra-tooling/javascript-abort-timeout.md).
- [배열 복사·정렬과 iterable 변환](../../knowledge/infra-tooling/javascript-copying-arrays.md).
- [외부 Promise 완료 제어](../../knowledge/infra-tooling/javascript-promise-with-resolvers.md).
- [작업 기록](../../worklog/2026-11/2026-11-20-modern-javascript-guidance.md).
- 원본: [WHATWG DOM](https://dom.spec.whatwg.org/#interface-abortsignal), [ECMAScript 배열](https://tc39.es/ecma262/2023/multipage/indexed-collections.html#sec-array.prototype.tosorted), [ECMAScript Promise](https://tc39.es/ecma262/2024/multipage/control-abstraction-objects.html#sec-promise.withresolvers), [TypeScript lib](https://www.typescriptlang.org/tsconfig/lib.html), [Modern Web Guidance js](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/js/js.md).
