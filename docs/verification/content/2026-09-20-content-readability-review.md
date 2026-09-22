# 공개 글 독해 관점의 편집 검토

## 대상과 조건

2026-09-20 KST, feature/docs `95560d6` 기준 로컬 공개 글 10개를 읽었다. archived ARIA 복제본과 draft 4개, 원격 글은 제외했다. 기본 독자는 웹 개발 경험은 있지만 해당 주제를 처음 배우는 개발자로 가정했다. 사전 지식을 가진 독자의 빠른 참조 용도도 따로 고려했다.

이 결과는 편집자의 원문 검토다. 독자 모집, 이해도 실험, 화면 가독성 측정이나 기술 주장 전체의 최신 사실 검증을 수행한 것은 아니다. 원문과 발행 상태는 변경하지 않았다.

## 재현 방법

각 파일의 title/summary를 먼저 읽고 예상하는 질문을 적은 뒤 본문에서 답을 찾았다. 이후 설명 순서, 핵심 용어, 실행 가능한 예제, 결과와 한계, 결론과 참고 자료를 확인했다.

다른 검토자도 [작성 정책의 독해 기준](../../architecture/docs-content-authoring-markup-policy.md#독해와-편집-검토)에 따라 같은 파일을 읽고 판단을 비교할 수 있다. 주관적 편집 판단을 자동 테스트 통과처럼 취급하지 않는다.

## 결과와 증거

### 우선 보완할 글

| 우선순위 | 글과 근거                                                                              | 독자가 막히는 지점                                                                                                               | 권장 조치                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| P1       | [V8](../../../apps/docs/data/v8/bytecode.mdx), summary 및 ByteCode 절                  | 깊이 알아본다고 하지만 짧은 사실 목록이다. 레지스터·누산기 설명 없이 Lda/Sta가 등장한다.                                         | 짧은 입문 메모로 제목·요약을 좁히거나, 작은 코드와 바이트코드 해설을 검증해서 추가한다.                                           |
| P1       | [ARIA](../../../apps/docs/data/shadcn/blocked-aria-hidden.mdx), ARIA란?/가설 절        | ARIA 정의 대신 경고 권고문으로 시작한다. 가설 뒤에 변경 코드와 검증 결과가 없어 해결됐는지 알기 어렵다. 이미지 alt도 파일명이다. | Drawer 경고 진단 글로 범위를 좁힌다. 환경 → 재현 → 원인 가설 → 실제 조치 → 확인 결과로 정리하고, 미확인 결과는 미확인으로 남긴다. |
| P1       | [Next.js 패키지](../../../apps/docs/category/fe/react/nextjs.mdx), 먼저 확인할 영역 절 | 제목은 내부 구조의 설명을 기대하게 하지만 본문은 앞으로 살펴볼 항목이다.                                                         | 제목을 패키지 탐색 체크리스트로 바꾸거나 실제 버전·파일·실행 결과를 추가한다.                                                     |

### 나머지 공개 글

| 글                                                                                                       | 현재 장점                                                              | 다음 보완                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [이벤트 루프](../../../apps/docs/data/v8/javascript-event-loop-runtime.mdx)                              | 브라우저/Node.js 구분과 점검 순서가 있다.                              | 실행 순서 예제와 관측 결과를 추가한다. task/microtask와 lag의 뜻을 풀고, 참고 절의 의견 대신 실제 출처를 연결한다.                                             |
| [Focus Management](../../../apps/docs/data/shadcn/focus-management-checklist.mdx)                        | 열기/닫기/테스트 단계가 명확해 경험자의 점검표로 읽기 좋다.            | focus/trigger/restore를 설명한다. Dialog·Drawer·Popover를 함께 묶었으므로 어떤 UI에 어떤 검사가 해당하는지 적용 범위를 명시한다.                               |
| [Server/Client 경계](../../../apps/docs/category/fe/react/server-client-component-boundary.mdx)          | 책임별 구분과 마지막 판단 질문이 명료하다.                             | 작은 컴포넌트 분리 전후 예제를 넣는다. 첫 문장만 보고 Client Component를 브라우저 전용 렌더링으로 오해하지 않게 실행/렌더링 용어를 구분한다.                   |
| [Process/Thread/Scheduler](../../../apps/docs/category/computer-science/os/process-thread-scheduler.mdx) | 개념을 세 덩어리로 나누고 실무와 연결한다.                             | address space, context switching, race condition을 풀이하고 하나의 구체적 상황으로 연결한다.                                                                   |
| [Timeout/Retry](../../../apps/docs/category/be/node-js/http-timeout-retry-boundary.mdx)                  | 언제 재시도할지와 fallback 구분이 있다.                                | idempotent를 풀이하고 횟수·전체 예산 예시를 넣는다. 경고문의 fallback 금지와 마지막 화면 fallback 허용이 모순처럼 읽히므로 endpoint 전환과 UI 대체를 구별한다. |
| [HTML-in-Canvas](../../../apps/docs/data/canvas/readme.md)                                               | 코드·오류 메시지·원인·조치·한계가 이어져 문제 해결 흐름이 보인다.      | 재현한 브라우저 버전과 실험 기능 준비 방법을 덧붙인다. 처음 쓰는 paint record의 뜻을 짧게 설명하고 메모체를 문장으로 다듬는다. API 최신성은 별도 확인한다.     |
| [첫 화면 지연](../../../apps/docs/category/fe/browser/critical-rendering-path-diagnosis.mdx)             | 문단 설명, 비교표, 조건 통제, 주의점과 출처가 있어 가장 완결된 구조다. | TTFB/LCP/CLS/INP/CrUX/RUM의 첫 등장 풀이를 보완한다. 실험 준비 방법을 연결하고, 빈 기록표가 작성용 템플릿임을 표시한다.                                        |

### 전체에서 반복되는 문제

- 대부분의 짧은 글이 문장 한 개마다 목록으로 분리되어 있다. 훑기는 쉽지만 왜 다음 설명으로 넘어가는지 연결이 약하다. 개념과 인과관계는 문단으로, 체크리스트는 목록으로 유지한다.
- 한국어 문장 안에서 영어 일반 명사가 연속으로 등장한다. API 이름은 유지하되 처음에 한국어 뜻을 붙이고 같은 용어를 반복 사용한다.
- 체크리스트 글은 기존 지식이 있는 사람에게 유용하다. 입문용으로도 제공하려면 최소한 한 사례가 필요하지만, 모든 글에 코드 블록을 강제할 필요는 없다.
- 명시된 읽기 시간은 설정값이다. 짧은 본문을 읽는 시간과 내용을 이해하고 실험하는 시간을 혼동하지 않는다. 이번 검토에서 읽기 시간을 측정하지 않았다.

### 추가 대조: 실행 예제와 개념 설명

Canvas 글, 연결된 HTML 실험 파일, 이벤트 루프와 운영체제 글을 정적으로 비교하고 공식 자료와 대조했다. 아래는 원문 수정 전 검토 결과이며, 실험 브라우저에서 실행한 결과가 아니다.

- P2: Canvas 43행은 크기 속성이 없고 53행은 (280, 140)에 그린다. 기본 캔버스 크기는 300×150이므로 버튼이 잘릴 수 있다. 연결된 데모는 640×360을 명시한다. 본문의 재현 예제에도 같은 크기를 명시하고 CSS 표시 크기와 내부 그리기 크기를 구분한다. 근거: [WHATWG canvas 기본 크기](https://html.spec.whatwg.org/multipage/canvas.html#the-canvas-element).
- P2: Canvas 103행은 drawElementImage의 반환 변환 행렬을 버리지만, 연결된 데모 105행은 button.style.transform에 적용한다. 클릭 가능한 예제를 의도한다면 픽셀 출력과 DOM 히트 영역을 동기화하는 코드가 필요하다. 그리기 시점만 설명하는 축약 예제라면 상호작용 보정은 생략했다는 한계를 적는다. 근거: [Chrome HTML-in-Canvas 설명](https://developer.chrome.com/blog/html-in-canvas-origin-trial). 실험 API는 변경될 수 있으므로 재현 브라우저 버전도 별도로 기록해야 한다.
- P2: 이벤트 루프 35행의 "먼저 비워지는 경향"은 실행 순서가 경험적인 경향인 것처럼 읽힌다. 권장 표현: "브라우저는 microtask checkpoint에서 큐가 빌 때까지 microtask를 처리한다. 이 과정에서 추가한 microtask도 처리하므로 과도한 작업은 다음 task나 렌더링 기회를 지연시킬 수 있다." 모든 task보다 항상 먼저 실행한다는 뜻이나 Node.js 전체 순서로 확대하지 않는다. 근거: [WHATWG microtask checkpoint](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint).
- P2: 운영체제 31행의 "다른 process와 메모리를 직접 공유하지 않는다"는 명시적인 공유 메모리까지 불가능한 것으로 읽힌다. 권장 표현: "기본적으로 주소 공간이 분리되며, 공유 메모리 같은 명시적인 IPC 수단으로 일부 영역을 공유할 수 있다." 입문 글에서는 이 한 문장으로 범위를 한정하고 구현 세부 사항은 참고 자료로 연결하면 충분하다. 근거: [Microsoft 프로세스 간 공유 메모리](https://learn.microsoft.com/en-us/windows/win32/memory/creating-named-shared-memory).

### Canvas 보완 및 예제 검사

2026-09-20 후속 작업에서 Canvas 글만 수정했다. 앞선 검토의 "원문 미수정"은 검토 당시 상태다. 크기 640×360, transform-origin, 반환 행렬 적용을 명시하고 해결 코드를 독립적으로 실행하도록 정리했다. paint 리스너 중복 등록은 제거하고 미지원 환경에서 명시적으로 중단한다. 연결된 효과 데모 자체는 변경하지 않았다.

저장소 루트에서 다음 명령으로 재현한다.

```sh
mise exec -- node --test docs/verification/artifacts/2026-09-20-canvas-snippet.test.mjs
mise exec -- pnpm --filter docs test:content
```

[예제 추출 테스트](../artifacts/2026-09-20-canvas-snippet.test.mjs)는 글의 해결 코드 블록을 직접 실행한다. 크기·원점 명시, paint 전 그리기 금지와 단일 리스너, 반복 paint의 그리기·변환 적용, 미지원 환경 중단 등 4개가 통과했다. 콘텐츠 단위 테스트 17개도 통과했다. DOM과 context는 모의 객체이므로 실제 paint record 생성, 버튼 잘림과 클릭 정합성은 검증하지 않는다. 브라우저 버전·플래그 조건과 수동 확인 절차는 글에 남겼으며 실험 브라우저 실행은 미검증이다.

### Canvas 실제 브라우저 후속 검증

2026-09-20 15:01 KST, macOS Chrome 153.0.8010.48의 별도 프로필·headed 창에서 확인했다. `--enable-blink-features=CanvasDrawElement`, viewport 1000×700, deviceScaleFactor 1 조건이다. 앞 절의 브라우저 미검증 상태를 이번 범위에서 해소했다. Chromium의 [기능 정의](https://chromium.googlesource.com/codesearch/chromium/src/+/refs/tags/148.0.7778.264/third_party/blink/renderer/platform/runtime_enabled_features.json5)에서 실험 기능 이름을 확인했다.

본문 HTML·해결 JavaScript를 직접 추출한 페이지와 public의 기존 데모를 각각 localhost에서 제공했다. Next.js 개발 서버는 실행하지 않았다. 기존 사용자 브라우저 프로필은 사용하지 않았으며 테스트 창과 서버는 종료했다.

재현 조건은 로컬 Chrome과 docs 앱의 Playwright 의존성이다. 저장소 루트에서 실행한다. 실행 중에는 테스트 창을 다른 창으로 가리지 않는다.

```sh
mise exec -- node docs/verification/artifacts/2026-09-20-canvas-browser.mjs
```

결과는 `/tmp/canvas-browser-verification/`에 저장되며 실패한 조건이 있으면 종료 코드 1을 반환한다. [실행 스크립트](../artifacts/2026-09-20-canvas-browser.mjs), [원본 JSON](../artifacts/2026-09-20-canvas-browser-result.json), [본문 화면](../artifacts/2026-09-20-canvas-article.png), [데모 화면](../artifacts/2026-09-20-canvas-demo.png)을 보관했다.

| 확인 항목                     | 본문 예제                 | 연결 데모                  |
| ----------------------------- | ------------------------- | -------------------------- |
| 실제 paint 및 픽셀 출력       | 통과, 비투명 픽셀 1,406개 | 통과, 비투명 픽셀 14,076개 |
| 버튼 경계가 캔버스 안에 위치  | 통과                      | 통과                       |
| 버튼 중심의 실제 마우스 클릭  | click 1회                 | click 1회                  |
| 캔버스 좌상단 빈 영역 클릭    | click 추가 없음           | click 추가 없음            |
| hover 10 animation frame 유지 | 10/10 true                | 10/10 true                 |
| pageerror                     | 0건                       | 0건                        |

스크린샷도 직접 확인했으며 본문의 기본 버튼과 데모의 반사 효과 버튼이 잘리지 않았다. 초기 두 실행은 창 전면 활성화를 명시하지 않아 hover 즉시 조회값이 일정하지 않았다. 최종 실행은 `bringToFront()`와 hover 상태 대기 후 10프레임 관측을 사용했다. 따라서 초기 false를 콘텐츠 결함 또는 수정 완료로 단정하지 않는다.

이는 모의 객체가 아닌 실제 브라우저 검사다. 다만 모바일·DPR 2·반응형 크기 변경·키보드 및 스크린리더 접근성·배포된 Next.js 라우트 통합은 미검증이다. 기존 데모의 중복 paint 등록과 재시도 로직은 이번에 변경하거나 회귀 수정한 범위가 아니다.

#### 저장한 스크립트 재실행: 전체 통과 판정 보류

15:06 KST에 위 재현 명령을 실제 저장 경로로 다시 실행한 결과 종료 코드 1을 확인했다. [재실행 원본 JSON](../artifacts/2026-09-20-canvas-browser-recheck.json)을 별도로 보관한다. 앞 표는 15:01 실행의 관측값이지 반복 안정성을 보장하는 최종 판정이 아니다.

본문 예제는 픽셀 출력·경계·버튼 클릭 1회·빈 영역 클릭 무반응을 다시 확인했으나 hover는 10프레임 모두 false였다. 데모는 그리기까지 확인한 뒤 hover 대기가 3초를 초과해 해당 실행의 클릭 검사는 진행하지 못했다. 두 페이지의 pageerror는 여전히 0건이다. `bringToFront()`만으로 문제가 해소됐다고 볼 수 없다.

현재 판정은 **그리기와 클릭 성공 사례 확인, hover 반복 안정성 미확인**이다. 실제 커서와 OS 창 활성화의 영향인지, 실험 API의 hit testing 문제인지 원인을 확정하지 않았다. 후속으로 사용자 입력이 없는 독립 환경 또는 headless 환경과 비교하고 실제 포인터 이벤트·포커스 상태를 함께 수집해야 한다. 제품 코드나 데모를 추정으로 수정하지 않았다.

## 한계와 후속 작업

### 추가 문장 검토: 적용 범위의 오해 방지

2026-09-20 재검토에서 다음 항목은 제목 교정보다 먼저 보완할 대상으로 분류했다. 아래 문장은 권장 초안이며 글 원문에 적용하지 않았다.

- P1: Focus Management 45행은 모든 오버레이에서 Tab을 내부 순환시키라는 뜻으로 읽힌다. 요약에 Popover도 포함하므로 모달 여부를 먼저 구분해야 한다. 권장 표현: "모달 대화상자에서는 Tab과 Shift+Tab이 내부에서 순환하는지 확인한다. 비모달 UI는 역할과 상호작용에 맞춰 별도로 검토한다." [WAI-ARIA 모달 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)의 범위와 대조했다.
- P2: Timeout/Retry 56행은 fallback을 넓게 금지하지만 64행은 허용한다. 권장 표현: "인증 실패를 다른 endpoint로 우회하지 않는다. 공개 로컬 콘텐츠나 오류 안내로 화면을 유지할 때는 인증 실패를 운영 로그와 알림에 남긴다." 인증 대상 데이터를 무인증 fallback으로 노출해도 된다는 의미가 아니다.
- P2: Server/Client 경계 21행의 실행 위치 설명만으로는 Client Component가 브라우저에서만 렌더링된다고 오해할 수 있다. 권장 표현: "Next.js의 Client Component도 첫 로드에서는 서버에서 HTML로 미리 렌더링될 수 있다. use client는 브라우저 상호작용을 위한 모듈 경계를 선언한다." [Next.js 공식 설명](https://nextjs.org/docs/app/getting-started/server-and-client-components)과 대조했다.
- P2: ARIA 글 46~54행은 가설과 해결 방향을 제시하지만, 적용한 코드·버전·재검증 결과가 없다. 확인 기록이 없으면 해결 완료형 문장으로 고치지 않고 조사 기록임을 제목과 결론에 명시한다.

기술적 적용 범위 보완을 먼저 하고, 아래 제목·내용 정렬과 독자 검증을 이어간다. 이 검토도 전체 기술 사실 감사는 아니다.

1. ARIA → V8 → Next.js 패키지 글 순서로 제목·요약과 실제 설명 범위를 맞춘다. 실제 경험·실행 결과는 작성자가 확인한 사실만 사용한다.
2. 용어 설명과 예제는 최소 단위부터 추가한다. 길이를 늘리는 것 자체를 목표로 하지 않는다.
3. 대상 독자에게 한 문단 요약 또는 예제 수행을 부탁하고, 멈춘 문장과 되돌아 읽은 지점을 기록한다. 모집하지 않은 사용자 반응을 결과로 적지 않는다.
4. 자동 검사는 구조적 문제를 알려주는 보조 수단으로 유지한다. 기술적 정확성과 실제 이해도 검증은 분리한다.

## 관련 문서

- [문법·렌더링 점검](2026-09-20-local-content-review.md)
- [작업 기록](../../worklog/2026-09/2026-09-20-content-readability-review.md)
