# Docs 배포 브랜치 CI 로그 재검토

## 대상과 조건

- 2026-09-27 KST, `feature/docs` 커밋 `5dbbcc577e037c757c4dd6eab889cc012ab081bb`.
- [GitHub Actions CI 실행](https://github.com/IMHOJEONG/web-tech/actions/runs/36299583837)과 같은 SHA의 Documentation 검사 및 GitHub Production 배포 상태를 확인했다.
- CI 로그는 Next 개발 서버와 Playwright fixture의 기록이다. Vercel Runtime Logs 또는 실제 방문자의 오류율을 뜻하지 않는다.

## 재현 방법

저장소 루트에서 다음 명령으로 결과와 로그를 조회한다.

```bash
gh run view 36299583837 --json jobs
gh run view 36299583837 --job 108564640734 --log
gh api repos/IMHOJEONG/web-tech/deployments/6688831099/statuses
```

## 결과와 증거

- CI의 Commit Messages, Lint, Typecheck, Test, Shared UI 두 작업은 모두 성공했다. Documentation 검사도 성공했고 Production 배포 상태는 `success`였다.
- docs responsive smoke는 232 passed, 44 skipped, 실패와 flaky 0건으로 끝났다. 이어진 production article rendering은 44 passed였다.
- 성공한 Test 작업에도 React hydration mismatch 경고가 남았다. 첫 경고는 검색 input의 `caret-color: transparent` 속성 차이이고, 다른 경고에는 `/ko/web`의 header·topic filter·결과 목록에 덧붙은 `aria-hidden="true"`가 보인다. 각각 Playwright 캡처 시점 및 열린 modal의 DOM 변경과 관련될 가능성이 있지만 원인은 확정하지 않았다.
- production article rendering 단계에서 `The destination stream closed early.` 로그가 8회 출력됐다. 이 CI에는 요청별 계측을 싣지 않았으므로 여덟 건을 브라우저 취소나 실제 장애로 분류할 수 없다. [이전 로컬 계측](2026-09-26-request-lifecycle-recheck.md)의 두 요청과 동일하다고도 단정하지 않는다.

## 한계와 후속 작업

- 성공한 테스트와 배포 기록은 로그 경고의 원인 규명이나 실제 운영 상호작용의 성공을 보증하지 않는다.
- hydration 경고는 `aria-hidden`을 붙인 주체와 아직 hydration되지 않은 영역의 경계를 별도로 재현한다. 검색 input 경고는 스크린샷의 caret 처리 여부를 대조군으로 확인한다.
- 스트림 로그는 [요청 생명주기 정책](../../architecture/docs-request-lifecycle-logging-policy.md)에 따라 `unknown`으로 유지한다. 기존 미커밋 로컬 계측을 운영 코드에 섞지 않고 Vercel Preview 상관관계 검증을 별도 진행한다.
- 실제 배포 주소에서 모바일 drawer·주제 필터의 이력 탐색·검색을 확인한다.

## 후속 점검: hydration 경고 분리

- CI 로그의 `caret-color: transparent` 차이는 About 스크린샷 처리와 시간상 인접하지만, 인과관계는 확인되지 않았다. About 단독 모바일 1회 및 About·헤더 병렬 반복 16회 실행에서는 경고가 재현되지 않았다. 해당 스타일을 제거하거나 hydration 경고를 숨기는 변경은 하지 않았다.
- 별도 경고의 `aria-hidden="true"`는 모바일 drawer가 열린 동안 배경에 적용되는 속성과 형태가 같다. 그러나 CI 로그만으로 어떤 시점에 본문 hydration이 끝났는지 알 수 없으므로 원인을 확정하지 않았다. 접근성을 위해 modal 동작은 유지했다.
- drawer를 닫은 뒤 header와 main의 `aria-hidden`이 제거되는 회귀 검사를 추가했다. `env CI=true DOCS_E2E_PORT=3124 mise exec -- pnpm --filter docs test:e2e mobile-drawer-close.spec.ts --project=chromium-mobile --workers=1 --retries=0` 결과 4 passed이며, 이 범위에서는 경고가 발생하지 않았다.
- 경고의 확정 원인을 찾으려면 전체 CI 부하에서 해당 요청의 hydration 진행 여부, drawer open/close 시점, 스크린샷 호출 시점을 함께 수집해야 한다. 단독 테스트 통과를 전체 CI 경고 해결로 표기하지 않는다.

## 후속 점검: 실제 배포 상호작용

- `https://heap-forge.app/ko/web`는 `200`을 반환했다. Chromium 모바일 390×844에서 drawer 열기·닫기 및 배경 `aria-hidden` 복원을 확인했다.
- `/ko/web?topic=browser` 필터 선택 상태가 반영됐고 새로고침·뒤로가기·앞으로가기에도 URL 상태가 유지됐다. 전체 `load` 대기에서는 한 차례 시간 초과했지만 URL은 이미 이동해 있었고, navigation commit 기준 재검사에서는 정상 완료했다. 이미지 등 후속 리소스 로딩과 라우팅 성공을 구분해야 한다.
- Chromium 데스크톱 1280×800에서 헤더 검색은 `/ko/docs?q=react`, 본문 검색은 `/ko/docs?q=accessibility`로 이동했다. 두 점검에서 `pageerror`는 없었다.
- 인앱 브라우저 자동화는 실행 환경 초기화 오류로 사용할 수 없어, 위 결과는 headless Chromium 상호작용 점검이며 시각적 육안 검수는 아니다. 운영자의 다른 브라우저·기기와 모든 검색어를 대표하지 않는다.

## 2026-09-27 추가 원인 조사

### 스트림 종료

동일한 `content-publication.spec.ts` 한국어 모바일 시나리오를 production build fixture에서 비교했다.

```bash
ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
jq -s '{total:length,prefetch:([.[]|select(.prefetch==true)]|length),incomplete:([.[]|select(.closeBeforeFinish==true)]|length),stream_errors:([.[]|select(any(.events[]?; .errorCategory=="stream"))]|length)}' apps/docs/test-results/request-lifecycle/*.json
ARTICLE_DISABLE_PREFETCH=1 ARTICLE_STREAM_TRACE=1 mise exec -- pnpm --filter docs test:article:prod content-publication.spec.ts --project=article-mobile --grep 'ko:'
```

마지막 실행이 `test-results`를 교체하므로 각 실행 직후에 집계를 읽어야 한다. 활성 실행은 1 passed, 서버 요청 763건 중 prefetch 265건, 불완전 종료 56건(전부 prefetch), 스트림 오류 2건이었다. 오류 두 건은 상세 문서 RSC prefetch로, `200` 헤더를 보낸 뒤 58.93ms·66.36ms에 `responseFinished=false`, `responseClosed=true`가 기록됐다. 비활성 실행은 1 passed, 서버 요청 497건 중 prefetch 0건, 불완전 종료 0건, 스트림 오류 0건이었다. 비활성 모드는 Playwright가 prefetch 요청을 204로 가로채는 진단 대조군이지 운영 설정이 아니다.

설치된 Next 16.3.4의 React Server Components 스트림 구현은 destination의 `close` 이벤트에서 `createCancelHandler(request, "The destination stream closed early.")`를 호출한다. 이 로그는 **렌더 대상 스트림이 완료 전에 닫혔다**는 뜻이지, 그 자체로 원격 API 오류 또는 브라우저의 의도적 취소를 증명하지 않는다. 이번 로컬 fixture에서는 빠른 화면 이동 중 상세 RSC prefetch가 중단되는 경로가 가장 강한 설명이다. 두 오류의 브라우저 terminal 이벤트는 확보하지 못했으므로 개별 종료 주체와 운영의 동일 원인은 여전히 미확정이다.

### Hydration 경고 두 종류

- `caret-color: transparent`: Playwright 1.62.1 `locator.screenshot()`의 기본 `caret: 'hide'`가 스크린샷 동안 `input`, `textarea`, `contenteditable`에 인라인 `caret-color: transparent !important`를 추가하고 정리한다. 설치 코드 `playwright-core/lib/coreBundle.js`의 `hideCaret` 분기에서 확인했다. CI diff의 해당 스타일과 일치하지만, 스크린샷과 미완료 hydration의 실제 겹침 시점은 별도로 입증하지 못했다. 추후 `caret: 'initial'` 대조군으로 확인할 수 있다.
- `aria-hidden="true"`: 앱 모바일 drawer는 공용 `Sheet`를 사용하고, 공용 Sheet는 Base UI `Dialog.Root`다. 기본 modal이 열린 동안 Base UI `FloatingFocusManager`의 `markOthers(..., {ariaHidden: modal})`가 dialog 바깥 노드를 접근성 트리에서 숨긴다. CI diff의 header·본문 속성과 일치한다. 드로어 trigger는 헤더 hydration 후 활성화되지만, 본문 Suspense 영역의 hydration 완료를 보장하지는 않는다. 먼저 열린 modal의 DOM 변경과 늦게 도착한 본문 hydration이 겹쳤다는 설명은 유력하나 아직 타임라인 증거가 없다.
- React는 서버 HTML과 초기 클라이언트 렌더가 일치해야 한다. 두 경우 모두 앱의 서버 렌더 값 자체가 다른 것보다는 hydration 중 **외부 DOM 변경**이 발생한 형태에 가깝다. `suppressHydrationWarning`이나 `modal={false}`로 경고만 숨기지 않는다. 닫힘 후 `aria-hidden` 제거는 회귀 테스트에서 확인했다.

## 관련 문서

- [검색 E2E 수정](../../worklog/2026-09/2026-09-27-docs-index-search-locator.md)
- [모바일 탐색 E2E 수정](../../worklog/2026-09/2026-09-27-docs-mobile-navigation-e2e-stability.md)
