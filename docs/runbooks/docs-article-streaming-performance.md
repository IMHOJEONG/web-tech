# 상세 페이지 스트리밍 성능 개선

## 목적과 준비 조건

Node.js 24와 설치된 workspace 의존성을 사용한다. 원격 지연과 서버 렌더링 비용을
분리해 측정하되 운영 콘텐츠·토큰을 출력하지 않는다. 실제 배포 측정 전 로컬 fixture로 확인한다.

## 진행 순서

- [x] 문서 선택, 본문 변환, 탐색 목록 조회, 탐색 링크 계산 계측 추가
- [ ] 프로덕션 모드에서 로컬/원격 문서의 캐시 적중/미적중 기준값 수집
- [x] 관련 문서와 이어 읽기를 별도 Suspense 영역으로 분리
- [x] 상세 렌더링 요청 내 로컬 문서 전체 읽기 중복 제거
- [ ] 콘텐츠 변경과 렌더러 버전을 고려한 렌더링 결과 캐시 적용

## 측정 방법

객체 계약은 별도 interface로 관리한다. UI props는 `article-content.types.ts`, 계측 이벤트와
제네릭 측정 함수 계약은 `article-timing.types.ts`에 둔다. 단계 이름의 문자열 유니온은 type을 유지한다.
컴포넌트는 `ReturnType<typeof createArticleTiming>` 대신 `ArticleTimingMeasure` 계약에 의존한다.
타입 의존성은 `import type`으로 가져오며 런타임 동작과 스트리밍 경계는 변경하지 않는다.

### 부가 영역 분리

`page.tsx`는 문서 선택과 본문 변환까지만 기다린다. `ArticleSupplementary`가 목록 조회와
관련 문서/이어 읽기 계산을 담당하고, 레이아웃의 `ArticleSupplementaryBoundary` 아래에서 실행된다.
본문과 TOC는 이 조회의 완료를 기다리지 않는다. HTML과 MDX 모두 같은 경계를 사용한다.
부가 데이터 준비에 실패하면 원문 오류 없이 서버 경고를 남기고 해당 영역만 생략한다.
스켈레톤은 공용 토큰과 번역을 사용하며 reduced-motion에서는 pulse 애니메이션을 적용하지 않는다.

페이지에서 생성한 계측 함수를 같은 서버 컴포넌트 트리에 전달하므로 네 단계의 traceId는 유지된다.
클라이언트 컴포넌트로 함수나 문서 전체를 전달하지 않는다.
동기 파일 읽기 및 CPU 작업 자체는 여전히 이벤트 루프를 점유한다. 이번 분리는 비동기 대기를
분리하는 조치이며, 모든 종류의 지연 또는 CLS가 해결되었다는 의미는 아니다.

개발 서버 터미널 또는 Vercel Runtime Logs에서 `[docs.article_timing]`을 검색한다.
환경 변수 설정 없이 항상 서버에서 출력한다. 같은 페이지 실행의 단계들은 `traceId`가 같다.
요청 URL, 토큰, 본문, 원본 오류 메시지는 기록하지 않는다.

| stage            | 의미                                                             |
| ---------------- | ---------------------------------------------------------------- |
| document-select  | 캐시된 문서 선택 함수 대기 시간. 원격 우선 확인이 포함될 수 있음 |
| content-render   | MDX evaluate 또는 원격 HTML 정규화 시간                          |
| navigation-load  | 관련 문서 계산에 사용할 전체 목록 조회 시간                      |
| navigation-build | 관련 문서와 이전/다음 문서 계산 시간                             |

`durationMs`는 각 작업의 경과 시간이지 CPU 사용 시간이 아니다. metadata에서 먼저 시작한
React cache 작업을 공유하면 document-select는 남은 대기 시간만 보일 수 있다.
React 하위 컴포넌트 렌더링, hydration, 이미지 로딩, TTFB/LCP는 이 계측에 포함되지 않는다.
프로세스가 강제 종료되면 진행 중인 단계의 완료 로그가 없을 수 있다.

로컬 문서, 원격 문서, 원격 장애 시 로컬 fallback을 각각 확인한다. 캐시가 있는 요청과
없는 요청을 구분하고 반복 측정한다. 공개 서비스에 장애를 유발하지 말고 로컬 fixture를 사용한다.
실측 전에는 특정 단계가 느리다고 단정하지 않는다. 원격 우선 정책은 이번 계측에서 변경하지 않는다.

## 실행 순서

### 요청 내 로컬 문서 공유

`getLocalDocsData()`의 파일 읽기와 frontmatter 파싱은 모듈 단위로 선언한
React `cache` 함수에서 수행한다. 상세 선택과 부가 영역 목록 조회가 같은 RSC
렌더링에서 스냅샷을 공유한다. 요청 간 영속 캐시나 `use cache`를 추가하지 않는다.
호출자에는 배열 복사본을 반환하고 정렬도 복사본에서 수행한다. 내부 배열은 freeze한다.
문서 필드와 태그 배열은 readonly 타입으로 보호한다. 객체 자체의 deep freeze/복제는
하지 않으므로 JavaScript 호출자까지 런타임 불변성이 보장되는 것은 아니다.

React 서버 렌더링 바깥에서 직접 호출하면 같은 memoization을 보장하지 않는다.
로컬 콘텐츠가 배포 산출물에 포함되는 정책은 유지하며, 운영 로컬 글 수정은 여전히
재배포가 필요하다. 원격 우선 선택, 원격 fetch TTL/tag, 웹훅 계약은 변경하지 않는다.
세 로더의 정규화는 `parseLocalDocument()`를 공유한다. 파일 탐색과 I/O는 별개이므로
검색·카테고리까지 요청 캐시가 확장된 것으로 해석하지 않는다.
본문 구분선 보존, 공개 상태, readonly 계약은 다음 단위 검사로 확인한다.

```sh
pnpm --filter docs exec node --experimental-strip-types --test lib/article-timing.test.ts
pnpm --filter docs typecheck:node-test
pnpm --filter docs test:lib
pnpm --filter docs test:article:prod
pnpm --filter docs test:article:prod local-document-reads --project=article-mobile
```

마지막 명령은 별도 fixture로 프로덕션 빌드와 상세 페이지 회귀 테스트를 실행한다.
동일 체크아웃에서 개발 서버나 다른 빌드를 동시에 실행하지 않는다.

읽기 횟수 테스트는 프로덕션 테스트 서버에만 `local-io-probe.ts`를 preload한다.
유효한 테스트 UUID 헤더가 있는 요청의 동기 Markdown 파일 읽기와 디렉터리 조회만
AsyncLocalStorage로 집계한다. 운영 애플리케이션·Next 설정에는 probe를 import하지 않는다.
`test-results/local-io` 및 테스트 attachment에는 횟수만 저장하고 파일 경로·본문·토큰은 남기지 않는다.
각 요청의 모든 파일 읽기가 1회인지, 다음 요청에서도 새로 읽는지 검사한다.

## 기대 결과

계측 단위 테스트와 타입 검사를 통과하고 실제 상세 본문이 부가 영역 조회와 독립적으로
표시되어야 한다. 단계별 시간은 같은 traceId로 묶어 비교하고 캐시 상태와 표본 수를 기록한다.
회귀 테스트 통과만으로 LCP 개선을 주장하지 않는다.

## 실패 대응과 복구

본문이 보이지 않으면 `.mdx-wrapper` 내부와 서버의 실패 stage를 먼저 확인한다.
부가 영역만 실패했다면 본문은 유지되어야 한다. 운영에서 장애를 유발하거나
timeout 값을 늘려 실패를 숨기지 않고 로컬 fixture에서 재현한다.

## 관련 검증

- [상세 렌더링 검사 절차](docs-article-rendering-regression.md)
- [게시 갱신 및 스트림 취소 비교](../verification/cache/2026-09-19-content-publication-browser-test.md)
- [로컬 문서 읽기 중복 제거 검증](../verification/performance/2026-09-19-local-document-reads.md)
