# CI 스트림 조기 종료 8건 추적

## 대상과 조건

- 2026-10-18 KST. 기준 커밋 `f4b958254486c18ae1df2909fbf26595add8919f`, `feature/docs`와 이번 테스트 전용 변경을 사용했다.
- 대상은 [CI 39102318262](https://github.com/IMHOJEONG/web-tech/actions/runs/39102318262)의 Test job `117600937450`에 남은 `The destination stream closed early.` 8건이다. 당시 상세 production 검사는 108개 통과했다.
- Node 24.12.0, Next.js 16.3.8, Chromium 모바일 390×844·데스크톱 1280×800, worker 1·재시도 0. production Next 3111과 합성 콘텐츠 서버 3112만 사용했다.
- 운영 NAS·Vercel webhook을 호출하거나 운영 prefetch·오류 필터·의존성 버전을 변경하지 않았다. TCP 초안은 수정하지 않았다.

## 재현 방법

저장소 루트에서 다른 dev/build 및 3111·3112 사용 프로세스를 종료하고 순차 실행한다. 각 명령은 production build를 포함한다.

```bash
# 기존 게시 갱신 시나리오: 브라우저 dispatch + 서버 finish/close + Chromium 기록
ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts

# 비교군: prefetch만 204로 대체, 일반 화면·웹훅은 그대로 실행
ARTICLE_STREAM_TRACE=1 ARTICLE_DISABLE_PREFETCH=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts

# 본문 보류 상태에서 이동 / 서버 완료 후 이동, 실제 장애 음성 대조군
mise exec -- pnpm --filter docs test:article:prod prefetch-termination.spec.ts request-lifecycle.spec.ts

# 진단 옵션 없이 전체 회귀
mise exec -- pnpm --filter docs test:article:prod
```

`apps/docs/test-results/request-lifecycle/*.json`은 요청 UUID별 서버 요약이다. 다음 실행이 지우므로 필요한 결과를 먼저 보관한다. 새 대조 검사는 `prefetch-termination` attachment도 남긴다. 원본 헤더·인증값·본문·검색어는 증거에 저장하지 않는다.

Chromium 진단의 `[article-browser-network]`는 고정된 합성 상세 경로, 요청 UUID, `prefetch`, `canceled`·`aborted` 여부와 이동 시각만 기록한다. 테스트 전용 `x-article-client-probe`를 CDP `requestWillBeSentExtraInfo`와 연결하고, 응답 UUID가 있으면 서버 기록과도 대조한다.

## 결과와 증거

### 결론과 확정 범위

**최종 재조사에서 로컬 오류 8건은 상대편이 먼저 종료한 RSC prefetch로 확인했다.** 서버 `end/destroy` 호출보다 소켓의 상대편 전송 종료 이벤트가 먼저였고, 응답 close 뒤 React 오류가 발생했다. 원격 본문은 이후 200으로 완료됐다. 문서 전체 이동과의 인과관계는 별도 보류·완료 및 실제 Link 대조로 보강한다. `page.goto()` 자체가 잘못됐거나 메시지가 정상 취소를 뜻한다는 결론은 아니다.

과거 CI 8건 모두를 정상 취소로 소급 확정하지 않는다. 당시 로그에는 경로 템플릿과 runtime UUID만 있고 해당 요청의 소켓·prefetch·finish·close 기록이 없다. 역사적 판정은 `unknown`이며, 아래 [종료 주체 재조사](#종료-주체와-선행-오류-재조사)와 당시 기록의 차이를 유지한다.

| 대상                                | 관측과 판정                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 원격 CI 8건                         | 모두 게시 갱신 E2E 실행 구간. 모바일·데스크톱의 ko/en 4개 케이스마다 2건. 실제 서비스 장애 여부를 당시 기록만으로 확정 불가 |
| 기존 로컬 계측 재현                 | 게시 갱신 4개 통과, 같은 오류 8건                                                                                           |
| Chromium 계측 재현                  | 게시 갱신 4개 통과, 오류 8건 모두 `/ko 또는 en/docs/web/article-e2e-remote`의 RSC prefetch                                  |
| prefetch 차단 비교군                | 4개 통과, 서버·프레임워크 스트림 오류 0건. 실제 prefetch 검증의 대체물은 아님                                               |
| 보류·완료 대조 및 상태 판정 검사    | 42개 통과. 보류 중 이동 2개는 같은 오류, 서버 완료 후 이동 2개는 오류 없이 완료                                             |
| 진단 옵션 없는 전체 production 회귀 | 116개 통과 (1.1분). 스트림 로그 10회: 기존 게시 갱신 구간 8회와 새 의도적 중단 대조 2회. 로그는 숨기지 않음                 |

CI 오류 시각은 UTC이며 KST는 9시간을 더한다. 각 UUID 전체와 원본 행 번호는 [정제 증거](../artifacts/2026-10-18-stream-termination-investigation.json)에 보관했다.

| 케이스     | CI UTC 오류 시각 2회        |
| ---------- | --------------------------- |
| mobile ko  | 06:05:36.434 / 06:05:39.099 |
| mobile en  | 06:05:41.053 / 06:05:43.646 |
| desktop ko | 06:06:02.704 / 06:06:05.661 |
| desktop en | 06:06:07.889 / 06:06:10.744 |

### 요청별 증거

Chromium 계측 실행의 오류 8건은 모두 다음 순서다.

1. `article-e2e-remote`에 `prefetch=true`, `requestKind=rsc` 요청을 전송한다.
2. HTTP 200 헤더를 받는다. 서버가 본문 전체를 완료했다는 뜻은 아니다.
3. 다른 문서로 이동한다. 서버 close와 가장 가까운 이동 이벤트 차이는 -2~13ms다. 이 시각 근접성 자체만으로 인과관계를 확정하지는 않는다.
4. 서버 `close`가 `finish`보다 먼저 발생하고 이어서 `after-headers` 단계의 stream error가 기록된다.

8건 모두 `responseFinished=false`, `responseClosed=true`, `closeBeforeFinish=true`다. 관측한 선행 render/upstream/timeout 오류는 없지만 `errorCoverage=partial`이다. 같은 실행에서 전경 document 요청 84건은 모두 서버 완료했다. 이는 해당 표본에서 본문 탐색 장애를 관측하지 않았다는 뜻이지 모든 운영 요청이 정상이라는 뜻은 아니다.

중요하게도 **오류 난 8개 요청의 Chromium terminal 이벤트는 이번에도 누락됐다.** 다른 요청의 `canceled=true`·`ERR_ABORTED`를 끌어와 이 8건의 취소 증거로 사용하지 않았다. 기계 판정은 기존처럼 `unknown / prefetch-cancellation-suspected`를 유지했다.

### 페이지 이동 원인의 대조 실험

새 `prefetch-termination.spec.ts`는 지연 시간에 운을 맡기는 대신 합성 콘텐츠 본문을 gate로 보류한다. 두 조건 모두 HTTP 200 헤더 수신과 서버 미완료 상태를 먼저 확인한다.

- `navigate-pending`: 본문을 풀어주지 않은 상태에서 `page.goto('/ko/docs')`로 문서를 교체한다. 서버 `close → stream error`가 발생하며 이동한 화면의 main은 표시된다.
- `finish-before-navigation`: 본문을 해제하고 **서버의 finish를 관측한 뒤** 같은 이동을 한다. `finish → close`, 오류 없음, `completed`가 된다. 브라우저 소비 완료까지 주장하지 않는다.
- 별도 실제 HTTP 대조군은 render·upstream·timeout·HTTP 500을 실패로, 근거 없는 단절은 unknown으로, 명시적인 제어 취소와 충분한 관측을 갖춘 경우만 cancelled로 유지한다.
- 새 회귀는 `close → stream error`만으로 정상 취소 판정이 나오지 않는지, 취소 단서와 후행 stream error가 선행 upstream 장애를 가리지 않는지도 검사한다.

처음 만든 대조군은 36개 통과·2개 실패했다. 한 케이스는 브라우저 `response.finished()`를 기다리다 timeout이 났고, 다음 케이스는 이전 중단 요청의 늦은 콘텐츠 완료로 이미 서버 완료 상태였다. 서버 finish polling과 이전 origin 작업 정리 후 캐시 무효화로 **테스트 격리와 관측 방식을 수정**해 42개를 재검증했다. 앱의 timeout을 늘리거나 실패 assertion을 제거한 것이 아니다.

### 코드에서 확인한 발생 경로

게시 갱신 검사는 화면별 캐시 내용을 확인하려고 `page.goto()`를 반복한다. 본문과 보조 콘텐츠 DOM이 표시돼도 관련 링크의 **별도 prefetch 응답**까지 끝난 것은 아니다. fixture의 원격 글 본문은 원래 350ms 지연되므로, 빠르게 다음 화면으로 이동하면 그 요청이 남을 수 있다. 캐시 무효화 전후에 차가운 본문을 다시 가져오는 구간이 생긴다. 케이스당 2회라는 관측과 부합하지만 횟수 자체를 장애 분류 기준으로 삼지 않는다.

설치된 Next.js 16.3.8의 다음 파일을 직접 읽었다.

```bash
rg -n 'function createCancelHandler|function abort\(|closed early' apps/docs/node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.node.production.js
sed -n '2254,2280p' apps/docs/node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.node.production.js
sed -n '3541,3548p' apps/docs/node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.node.production.js
```

RSC 렌더러의 destination close 처리기가 `abort(request, Error(reason))`를 호출하며, 남은 abortable task가 있으면 오류 처리 경로에 들어간다. 이 destination은 내부 Writable일 수도 있다. **메시지 하나만으로 HTTP 취소나 서버 장애를 판정할 수 없는 이유**다. 테스트의 HTTP close 및 페이지 이동 대조를 함께 본 이유도 같다. CI digest `4258946053`와 로컬 `1853719082`의 차이는 원인 판정 근거로 사용하지 않았다.

### 실제 Link 클릭과 문서 교체 비교

후속 질문에 따라 먼저 앱과 설치된 Next.js의 이동 코드를 확인하고, `prefetch-navigation.spec.ts`로 비교했다. **앞선 오류는 문서 전체 교체 조건에서 재현됐으며, 이번 실제 Link 클릭 조건에서는 재현되지 않았다.** 일반적인 페이지 이동이 항상 prefetch를 끊는다는 설명으로 확대하면 안 된다.

#### 이유를 먼저 확인한 코드

- 앱의 `shared/i18n/navigation.ts`는 `next-intl/navigation`의 `createNavigation()`으로 Link를 제공한다. 헤더 메뉴·모바일 drawer·관련 글은 이 실제 컴포넌트를 사용한다.
- 설치된 Next.js의 `dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`는 Link의 client-side transition이 문서 전체를 다시 로드하지 않고 공유 layout을 유지한다고 설명한다. `page.goto()`는 이 클릭 처리를 거치지 않고 문서 전체를 교체한다.
- `next/dist/client/components/links.js`의 `unmountPrefetchableInstance()`는 링크 제거 시 `cancelPrefetchTask()`를 호출한다. 하지만 `segment-cache/scheduler.js`의 해당 함수는 `isCanceled` 표시와 queue 제거를 수행한다. 이 함수 이름만으로 진행 중인 fetch의 `abort()`까지 발생했다고 판단할 수 없다.
- 같은 버전 `segment-cache/cache.js`의 `fetchPrefetchResponse()`는 `createFetch()`를 취소 signal 없이 호출한다. 관측 결과와 함께 보면, 같은 문서의 client router가 유지될 때 시작된 네트워크 응답이 계속될 수 있는 이유와 부합한다. 다른 버전·다른 요청 종류까지 일반화하지 않는다.

다음 명령으로 확인한 설치 소스를 다시 찾을 수 있다.

```bash
rg -n 'unmountPrefetchableInstance|cancelPrefetchTask' apps/docs/node_modules/next/dist/client/components/links.js
sed -n '132,143p' apps/docs/node_modules/next/dist/client/components/segment-cache/scheduler.js
sed -n '2438,2447p' apps/docs/node_modules/next/dist/client/components/segment-cache/cache.js
```

#### 비교 조건과 결과

최초 측정 12개가 통과한 뒤 결과를 회귀 기대값으로 고정했다. ko/en × 모바일/데스크톱 × 세 이동 방식의 12개 조건을 각각 3회 반복해 처음 36개가 통과 (1.1분)했다. 아래에 기록한 목적지·파일 기록 보완 후에도 **최종 36개 통과 (1.2분)**로 결과가 같았다. Node 24.12.0, Next.js 16.3.8, React 19.2.6, Playwright 1.62.1이다. 아래 표는 최종 반복 실행만 집계한 것이다.

| 이동 방식                       | 표본 | 같은 문서 유지 | 대상 prefetch 조기 종료·stream error | 대상 prefetch 서버 완료 |
| ------------------------------- | ---- | -------------- | ------------------------------------ | ----------------------- |
| `page.goto('/ko 또는 en/web')`  | 12   | 0              | 12                                   | 0                       |
| 실제 Web 메뉴 클릭              | 12   | 12             | 0                                    | 12                      |
| prefetch 중인 실제 관련 글 클릭 | 12   | 12             | 0                                    | 12                      |

모든 조건은 같은 합성 원격 글의 prefetch가 HTTP 200 헤더를 받았지만 서버는 아직 완료하지 않은 상태에서 시작한다. Web 이동의 목적지는 두 방식에서 동일하며, 모바일은 실제 drawer를 열고 메뉴를 클릭하고 데스크톱은 실제 헤더 메뉴를 클릭했다. 관련 글 이동도 기존 화면의 실제 anchor를 클릭했다. Link나 href를 테스트용 컴포넌트로 교체하지 않았다.

- Web 메뉴 클릭 12개는 목적지 UI가 나타난 시점에도 **기존 prefetch가 미완료·미종료**였다. 이후 본문 gate를 해제하자 `finish → close`로 정상 완료했다. 페이지를 벗어났다는 사실과 네트워크 요청의 중단은 다르다.
- 관련 글 클릭은 해당 글을 표시하려면 보류한 본문이 필요하므로 클릭 직후 gate를 해제했다. URL뿐 아니라 실제 마지막 본문 문장까지 확인했고, 원래 prefetch는 12개 모두 완료했다.
- 같은 document의 window에 둔 임시 UUID가 실제 클릭에서는 유지됐고 `document` 요청은 0건이었다. `page.goto()`에서는 UUID가 사라지고 목적지 `document` 요청이 1건이었다. 따라서 URL만 바뀐 것을 client navigation으로 오인하지 않았다.
- 브라우저 미처리 오류는 36개 모두 0건이었다. 관련 글 클릭 시에는 별도의 전경 RSC 요청도 12회 관측했으므로 **prefetch HTTP 응답 하나를 반드시 그대로 재사용한다거나 요청이 항상 하나뿐이라고 주장하지 않는다.**

```bash
mise exec -- pnpm --filter docs test:article:prod prefetch-navigation-client.spec.ts prefetch-navigation-direct.spec.ts --repeat-each=3
```

[실제 클릭 비교 증거](../artifacts/2026-10-18-prefetch-navigation-comparison.json)에 반복별 원래 요청 UUID·이동 전/목적지 표시/본문 해제 후 상태·문서 유지 여부·추가 RSC 여부와 원본 로그 SHA-256을 보관했다. 보류 상태의 서버 요약은 최초 이벤트 이후 갱신되지 않아 `headersSent=false`가 남을 수 있다. HTTP 200 수신은 별도 `prefetchStatus`로 기록했으며 서로 혼동하지 않는다.

전체 suite에 목적지 카드 검증을 추가한 첫 실행에서는 119개 통과·9개 실패했다. 8개는 Web 허브에 없는 합성 publication 카드를 찾은 테스트 기대값 오류였다. 실제 Web 목록의 `javascript-event-loop-runtime` 카드로 바로잡았다. 존재하지 않는 카드를 10초 기다리면서 보류 요청의 2.5초 deadline도 넘겼으므로, 이때의 timeout은 정상 취소로 분류하지 않고 잘못된 실험 조건의 실패로 남긴다.

나머지 1개는 기존 완료 대조 검사에서 JSON 요약을 덮어쓰는 순간 읽은 파일 경합이었다. 테스트 전용 probe를 `임시 파일 쓰기 → 같은 디렉터리에서 rename`으로 바꿔 독자가 이전 또는 새 완성본만 읽도록 했다. Next의 스트림 처리나 앱 timeout은 변경하지 않았다. 첫 실패의 로그 해시와 원인은 같은 비교 artifact에 보관한다.

보완 후 전체 production 회귀는 **128개 통과 (1.4분)**했다. 스트림 로그 14회는 기존 게시 갱신 구간 8회, 기존 의도적 이동 대조 2회, 새 문서 교체 대조 4회이며 실제 Link 비교에서는 0회였다. 이 수치를 테스트 실패 수나 운영 장애율로 해석하지 않는다.

이번 비교는 다른 정상 prefetch를 204로 대체하지 않았다. 다만 대상 요청 계측을 위한 route interception이 브라우저 HTTP cache를 비활성화한다. 합성 본문 보류와 지정된 두 화면·한 Chromium 엔진의 결과이며 운영 발생률, 느린 실기기나 네트워크 단절·새로고침·외부 링크에 대한 보장은 아니다. 과거 CI 8건의 역사적 unknown 판정도 그대로 유지한다.

### 검사 역할 분리와 의도 보존

이후 사용자 요청에 따라 위 비교의 혼합 spec인 `prefetch-navigation.spec.ts`를 클릭용 `prefetch-navigation-client.spec.ts`와 직접 URL 대조용 `prefetch-navigation-direct.spec.ts`로 나눴다. 위 재현 명령은 현재 파일명에 맞췄으며, 앞선 36회 비교 artifact의 당시 파일명·결과는 변경하지 않았다. 공통 gate·계측·최종 판정은 `prefetch-navigation-scenario.ts`에 유지하고, 각 spec이 실제 클릭 또는 `page.goto()`를 제공한다.

기존 `article-detail.spec.ts`의 이름을 `direct URL`로 바로잡고 직접 접근·새로고침·404 검증을 보존했다. 별도 `article-navigation.spec.ts`는 실제 검색 결과 카드의 Link를 클릭해 로컬 data·category·원격 HTML 상세를 검사한다. 출발 화면 준비만 `page.goto()`를 사용하고 검증 대상 이동에는 쓰지 않는다. window UUID 유지 및 새 document 요청 0건도 검사해 일반 anchor reload가 섞이지 않게 했다.

두 검사 모두 `article-fixtures.ts`의 동일한 본문·canonical·JSON-LD·OG·로딩 종료 assertion을 사용한다. 이전 커밋과 TypeScript 토큰을 대조해 공통 함수 본문의 429개 토큰, 문서 사례, 기존 직접 접근/reload callback, 게시 캐시 화면 검사 본문이 동일함을 확인했다. 포맷·주석은 제외하되 문자열·연산자·assertion 순서는 제외하지 않았다.

게시 갱신 검사는 `direct URL cache`로 표시하고 독립 문서 요청을 유지했다. Link로 전부 바꾸면 브라우저 Router Cache와 서버 캐시 검증이 섞일 수 있기 때문이다. V1/V2, 누락·오류·읽기 토큰의 401, 정상 웹훅 후 reload, 오래된 요약 검색 제거는 그대로다. 기존 탭이나 Router Cache의 즉시 자동 갱신을 약속한 변경은 아니다.

```bash
mise exec -- pnpm --filter docs test:article:prod article-detail.spec.ts article-navigation.spec.ts content-publication.spec.ts prefetch-navigation-client.spec.ts prefetch-navigation-direct.spec.ts prefetch-termination.spec.ts
mise exec -- pnpm --filter docs test:article:prod
```

| 재정리 후 대상                  | 통과 |
| ------------------------------- | ---- |
| 직접 상세 접근·reload·없는 문서 | 16   |
| 실제 카드 Link 상세 이동        | 12   |
| 직접 URL 게시 캐시·인증         | 4    |
| prefetch 실제 Link 클릭         | 8    |
| prefetch 직접 URL 문서 교체     | 4    |
| 보류/완료 후 직접 URL 대조      | 4    |

핵심 48개 통과 (1.3분), 전체 **140개 통과 (1.6분)**다. 원래 128개를 삭제하지 않고 실제 카드 클릭 12개를 추가했다. 전체 스트림 로그 14회는 서버 캐시의 직접 접근 8회와 의도적 URL 중단 대조 6회에 남으며 숨기지 않았다. [정리 후 증거](../artifacts/2026-10-18-navigation-test-contracts.json)에 역할별 집계·원본 로그 해시·검증 코드 보존 결과를 남겼다. 실행 그룹은 [현재 runbook](../../runbooks/docs-article-rendering-regression.md#이동-방식별-검사-역할)을 따른다. 앱 UI·운영 캐시 정책·ADR 판정은 바꾸지 않았다.

### 종료 주체와 선행 오류 재조사

앞선 `close → stream error`와 이동 시각 비교만으로는 누가 먼저 끊었는지 알 수 없었다. `console.error`만 관측하면 `console.warn`으로 출력되는 콘텐츠 fetch 오류도 놓칠 수 있다. 이번에는 테스트 preload에서 다음 항목을 같은 요청 UUID에 추가했다. 운영 앱이나 fetch 인자·캐시 키는 바꾸지 않았다.

- 소켓의 상대편 `end`, 로컬 `end()/destroy()` 호출, `error/close/timeout`, 응답 `end()/destroy()/finish/close` 순서.
- Undici의 고정 loopback 콘텐츠 경로 `create/headers/trailers/error`와 정제한 warning/error. 원문 헤더·본문·query·오류 메시지는 저장하지 않는다.
- runtime hook의 application UUID와 테스트 HTTP UUID 연결. 저장은 원자적 교체이며 이벤트 생략·기록 실패 수를 남긴다. 원래 오류 로그는 그대로 출력한다.

```bash
# 브라우저 route interception 없이 원래 게시 갱신 검사
ARTICLE_CAUSE_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts

# 브라우저의 실제 RSC 요청으로 완료·클라이언트 종료·서버 종료 대조,
# 별도 HTML 요청으로 실제 upstream 503 확인
mise exec -- pnpm --filter docs test:article:prod request-cause-next.spec.ts
```

`ARTICLE_CAUSE_TRACE`만 켜면 기존 브라우저 요청은 가로채지 않는다. `test-results/request-cause/*.json`은 고정된 합성 상세 경로만 대상으로 하며 다음 Playwright 실행 전에 따로 보관한다. 종료 주체 대조군은 조건을 고립시키기 위해 관련 없는 prefetch를 204로 대체한다. 대조군을 자연 발생 재현과 혼동하지 않는다.

최종 원래 시나리오 **4개 통과, 스트림 오류 8건**이다. 8건 모두 원격 글 RSC prefetch이고, `responseFinished=false`, HTTP 헤더 200이었다. 서버의 선행 `response.destroy()`·`socket.end()/destroy()`·timeout·관측 가능한 render/upstream 오류는 없었다. 아래는 요청 `1f57177f-9bfa-4943-af7e-c04c37aa926b`의 실제 경과 시간이다.

| 이벤트                         | 요청 시작 후 ms | 해석                                |
| ------------------------------ | --------------- | ----------------------------------- |
| upstream 시작                  | 24.95           | 원격 본문을 기다리는 중             |
| socket-end                     | 55.87           | 상대편 전송 종료가 먼저 관측됨      |
| socket-end-call / destroy-call | 57.81 / 58.59   | 그 뒤 서버의 소켓 종료 처리         |
| response-close                 | 60.02           | 응답 전체 완료 전 종료              |
| framework-stream-error         | 62.62           | 이후 React의 destination close 오류 |
| upstream 200 / complete        | 377.79 / 378.51 | 원격 본문은 오류 뒤에도 정상 완료   |

같은 요청의 runtime UUID까지 연결했으며 최종 표본 8건 모두 이 순서다. 초기 추가 계측 실행에서는 오류가 9건이었지만 같은 순서였다. 오류 횟수는 타이밍에 따라 달라지므로 8회라는 숫자를 원인 판별 조건으로 쓰지 않는다. [Node 24.12.0 소켓 문서](https://github.com/nodejs/node/blob/v24.12.0/doc/api/net.md#event-end)는 `end`를 상대편 전송 종료로 정의한다. 패킷을 직접 캡처하거나 종료한 사용자의 의도까지 관측한 것은 아니다. [Undici 진단 채널](https://undici.nodejs.org/api/DiagnosticsChannel)은 동일 outgoing request 객체로 요청·응답 완료를 연결하는 근거다. 실제 Node 내장 Undici는 7.16.0이었다.

대조 검사 **8개 통과**로 다른 원인도 분리했다.

| 조건                                       | 결과                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 보류 해제 후 완료, 두 화면                 | finish 확인, 스트림 오류 없음                                                                                    |
| 보류 중 직접 URL 이동, 두 화면             | 상대편 end가 먼저, 응답 close 뒤 같은 스트림 오류                                                                |
| 보류 중 서버 `response.destroy()`, 두 화면 | 서버 destroy가 먼저이며 상대편 end는 선행하지 않음. **동일 메시지·digest** 발생                                  |
| 이동 없는 upstream 503, 두 화면            | 503 → warning(http) → warning(empty) → render error → 응답 완료. 스트림 close 오류는 없었지만 정상 본문도 없었음 |

따라서 **같은 메시지라도 서버 쪽 강제 종료일 수 있고, 200·finish가 있어도 콘텐츠는 실패할 수 있다.** 로컬 재현은 원격 장애가 먼저 나서 끊긴 순서가 아니라 상대편 종료 후 React가 남은 렌더 작업을 abort한 순서다. 앞선 실제 Link 대조와 합치면 진행 중 prefetch를 문서 전체 교체가 중단하는 설명이 이 표본에 부합한다. 일반적인 Link 클릭이나 `page.goto()` API 자체를 결함으로 취급하지 않는다.

첫 대조군은 라우터 상태 없는 합성 RSC 요청이 shell로 완료돼 2개 통과·6개 실패했다. 다음 HTML 시도는 본문 보류 중 헤더가 flush되지 않아 timeout까지 기다렸고 4개 통과·4개 실패했다. 실패를 숨기거나 assertion을 제거하지 않고, 이미 스트리밍되는 **실제 브라우저 RSC 요청**으로 입력을 교정했다. HTTP 장애는 독립 HTML 검사로 유지했다. 이 두 실행은 앱 회귀 결과가 아니라 대조군 구성 실패이며 [새 정제 증거](../artifacts/2026-10-18-stream-cause-reinvestigation.json)에 명령·로그 해시·실패 조건을 남겼다.

원래 lifecycle 모델의 `errorCoverage=partial`과 보수적인 unknown 판정은 유지한다. 이 추가 계측은 공유 fetch의 첫 소유 요청에 연결될 수 있고, 관측되지 않은 오류·플랫폼 종료까지 배제하지 못한다. **과거 CI 8건의 개별 확정은 여전히 불가능하다.** Vercel 소켓을 직접 계측한 결과나 운영 전체가 정상이라는 주장도 아니다.

최종 변경으로 전체 production **148개 통과 (1.6분)**를 확인했다. 스트림 로그 18회는 그대로 출력됐다. 기존 직접 접근·중단 대조 실행에 새 클라이언트/서버 강제 종료 대조 4회가 추가된 결과이며, 로그를 숨겨 통과시킨 것이 아니다. 실제 Link 비교 8개는 문서 유지·본문 완료·브라우저 오류 0·prefetch finish를 다시 확인했다. 테스트 계측 TypeScript의 ESLint와 docs 타입 검사도 통과했다.

## 한계와 후속 작업

- 이번 작업은 원인 조사·테스트 계측·회귀 보강이다. 원격 CI 재실행·재배포와 Vercel의 실제 사용자 요청 연결은 아직 하지 않았다.
- 변경한 TypeScript 5개 파일의 ESLint, docs `typecheck`, `pnpm validate:docs`, 이번 파일의 Prettier 및 `git diff --check`가 통과했다. 기존 미커밋 23개 경로도 이번 README 링크만 제외하고 해시가 동일함을 확인했다.
- `onRequestError`는 오류 hook이지 HTTP 응답 전체 생명주기가 아니다. hook의 `routeType=render`가 곧 본문 렌더링 장애라는 뜻도 아니다. ADR-0008의 운영 관측 범위는 그대로 미완료다.
- route interception·CDP·동기 파일 기록이 있어 로컬 실행 시간을 운영 성능으로 일반화하지 않는다. 테스트 build에는 합성 endpoint가 들어가므로 운영 실행 전 정상 환경에서 다시 build한다.
- 로그를 숨기거나 앱 전체의 prefetch를 끄지 않았다. 취소를 확정하지 못한 건은 unknown으로 남기고, 전경 본문 실패·미복구 오류·5xx가 있으면 취소보다 장애를 우선한다.
- CI에서 재발하면 같은 SHA로 `ARTICLE_STREAM_TRACE=1` 진단을 실행해 요청 요약과 이동 기록을 함께 보관한다. 취소 주체의 명시적 신호가 없는 요청을 추측으로 cancelled로 바꾸지 않는다.

## 관련 문서

- [정제 증거와 로그 해시](../artifacts/2026-10-18-stream-termination-investigation.json)
- [실제 Link 클릭 비교 증거](../artifacts/2026-10-18-prefetch-navigation-comparison.json)
- [이동 역할 정리 후 증거](../artifacts/2026-10-18-navigation-test-contracts.json)
- [종료 주체 재조사 증거](../artifacts/2026-10-18-stream-cause-reinvestigation.json)
- [재조사 작업 기록](../../worklog/2026-10/2026-10-18-stream-cause-reinvestigation.md)
- [요청 생명주기 정책](../../architecture/docs-request-lifecycle-logging-policy.md)
- [ADR-0008](../../architecture/adr-0008-request-lifecycle-observability.md)
- [이전 로컬 계측의 한계](2026-09-26-request-lifecycle-recheck.md)
- [재현 runbook](../../runbooks/docs-article-rendering-regression.md#스트림-조기-종료-진단)
- [작업 기록](../../worklog/2026-10/2026-10-18-stream-termination-investigation.md)
