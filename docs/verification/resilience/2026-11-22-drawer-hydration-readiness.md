# Drawer 키보드 검사의 hydration 준비 상태

## 대상과 조건

- 검증일: 2026-11-22 KST. [PR #107](https://github.com/IMHOJEONG/web-tech/pull/107)의 최초 head는 05c6542a다. 추적은 [KAN-51 후속](https://web-tech-service.atlassian.net/browse/KAN-51)과 [통합 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=20676934)이다.
- [최초 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44979475147/job/137076593724)의 mobile/light는 주요 메뉴 1개를 기대했지만 5초 동안 0개였고 retry #1에서 통과했다. 당시 trace를 확보하지 못해 정확한 이벤트 순서는 미확정이다.
- 로컬은 macOS arm64, Node 24.22.1, pnpm 12.14.0, Next 16.4.6, Playwright Chromium이다. 합성 글 17개·archived 1개와 합성 PNG만 사용하고 실제 콘텐츠·키는 읽지 않는다.

## 재현 방법

[격리 export 절차](../../runbooks/docs-private-content-ci.md#기대-결과)로 공개 코드만 임시 사본에 준비한다. 실제 checkout에 합성 corpus 교체 명령을 실행하지 않는다. 아래 명령은 준비한 사본의 루트에서 실행한다. 모든 명령의 test timeout 30초·expect 5초는 기존 설정을 따른다.

```sh
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3087 pnpm --filter docs test:e2e shell-focus-contrast.spec.ts uiux-compact-cards.spec.ts --project=chromium-mobile --project=chromium-desktop --workers=2 --retries=0 --repeat-each=3
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3087 pnpm --filter docs test:e2e shell-focus-contrast.spec.ts drawer-hydration-readiness.spec.ts uiux-compact-cards.spec.ts uiux-readiness.spec.ts docs-index-readiness.spec.ts --workers=2 --retries=0
```

첫 명령은 수정 전 자연 반복의 기준 명령이다. 수정 후에는 같은 명령이 수정본을 검사하며 과거 실패를 재현하는 명령으로 해석하지 않는다. 두 번째의 UI/UX 회귀는 #109의 승인된 테스트를 격리 사본에 함께 적용한 결합 검사이며 #107 단독 변경 목록과 구분한다.

새 회귀는 실제 Next 정적 JavaScript 요청만 보류한다. 서버 HTML의 disabled 버튼에 직접 Enter를 보내도 메뉴가 열리지 않는 것을 확인하고, JavaScript를 해제한 뒤 같은 도우미로 실제 키보드 열기·닫기·포커스 복귀를 검사한다. HTML/React DOM 교체, 고정 sleep, 강제 클릭은 없다. 보류 gate와 route는 finally에서 해제한다.

## 결과와 증거

확인한 결함은 테스트의 준비 조건 누락이다. 앱은 서버 snapshot에서 메뉴·검색 버튼을 비활성화하고 hydration 후 활성화한다. 하지만 locator.press()는 클릭과 달리 enabled를 기다리지 않는다. 기존 검사는 그 차이를 확인하지 않고 Enter를 보냈다. 통제 실험에서 해당 키 입력이 유실되고 메뉴 0개가 되는 경로를 재현했다. 이 결과만으로 최초 CI도 반드시 같은 순서였다고 단정하지 않는다.

[키보드 도우미](../../../apps/docs/e2e/helpers/keyboard-drawer.ts)는 visible·enabled·focus를 먼저 확인하고 Enter 한 번과 aria-expanded=true를 검사한다. 기존 주요 메뉴 개수·검색 포커스·outline·대비·Tab 순서 검사는 삭제하지 않는다. 앱 런타임·CSS·CI·worker/timeout/retry 설정은 바꾸지 않는다.

| 검사                      | 결과                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| 수정 전 두 spec 자연 반복 | 39개 통과·기존 폭 조건 3개 제외, retry 0, 56.5초. 자연 실패 미재현                        |
| 준비 상태 통제 조사       | 모바일 키 입력 유실·UI/UX fallback 오판 2개 통과, retry 0, 11.4초                         |
| 수정 후 결합 검사         | 58개 통과·기존 폭 조건 2개 제외, retry 0, 1.3분                                           |
| 핵심 반복 조사            | 180개 통과, retry 0, 2.5분. 초기 gate 구현의 런타임 조사이며 아래 최종 호환 수정 전 결과  |
| 최종 Drawer 회귀          | 코드 bf2f9736의 gate·도우미와 동일한 4조건 × 3프로젝트 × 5회 = 60개 통과, retry 0, 59.2초 |
| 타입·변경 lint            | 두 PR docs typecheck·변경 7개 ESLint 통과. 아래 최초 타입 오류와 구분                     |

최초 새 gate의 Promise.withResolvers는 Node 24에서 실행됐지만 앱의 현재 TypeScript lib에 선언이 없어 TS2550으로 실패했다. 공통 설정·앱 lib를 확대하지 않고 기존 스트림 도우미와 같은 Promise 생성자 패턴으로 바꿨다. 타입 재검사와 최종 코드의 60회 회귀를 다시 통과했다. 앞선 58/180 결과를 최종 호환 수정 뒤 다시 실행한 것으로 바꾸지 않는다.

```sh
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3087 pnpm --filter docs test:e2e drawer-hydration-readiness.spec.ts --repeat-each=5 --workers=2 --retries=0
pnpm --filter docs typecheck
pnpm --filter docs exec eslint e2e/shell-focus-contrast.spec.ts e2e/helpers/keyboard-drawer.ts e2e/drawer-hydration-readiness.spec.ts --max-warnings 0
```

원시 로그·error-context·trace·캡처는 공개 artifact로 추가하지 않는다. 정제 수치만 기록한다. 기존 docs 필터의 native details open/hydration 경고는 별개이며 이 수정으로 제거됐다고 보고하지 않는다.

## 한계와 후속 작업

원래 CI의 지연 발생 원인과 당시 disabled 상태는 계측 부재로 미확정이다. 통제 재현한 준비 상태 결함과 자연 실패의 근본 원인을 구분한다. 로컬 통과는 원격 CI·main 병합·Production 배포·실기기·Safari/Firefox 검증을 대신하지 않는다. 원격 결과는 같은 head를 확인해 연결된 추적 기록에 남긴다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-drawer-hydration-readiness.md)
- [관련 UI/UX 후속 PR #109](https://github.com/IMHOJEONG/web-tech/pull/109)
- [기존 태블릿 준비 상태 조사](2026-11-08-docs-tablet-filter-readiness.md)
