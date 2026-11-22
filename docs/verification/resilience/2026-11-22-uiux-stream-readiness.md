# UI/UX 카드 검사의 스트리밍 준비 상태

## 대상과 조건

- 검증일: 2026-11-22 KST. [PR #109](https://github.com/IMHOJEONG/web-tech/pull/109)의 최초 head는 bbd4ca5c다. 추적은 [KAN-51 후속](https://web-tech-service.atlassian.net/browse/KAN-51)과 [통합 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=20676934)이다.
- [최초 CI](https://github.com/IMHOJEONG/web-tech/actions/runs/44979491477/job/137076643883)의 desktop/ko/light는 featured link 3개를 기대했지만 5초 동안 0개였고 retry #1에서 통과했다. 당시 본문 상태·원시 trace는 없어 근본 지연 원인은 미확정이다.
- macOS arm64·Node 24.22.1·pnpm 12.14.0·Next 16.4.6·Playwright Chromium, 합성 corpus만 사용한다. 실제 비공개 원문·자격 증명·NAS·운영 API는 사용하지 않는다.

## 재현 방법

[격리 export 절차](../../runbooks/docs-private-content-ci.md#기대-결과)로 합성 사본을 준비한다. 사본 루트에서 실행한다. 원본 checkout의 콘텐츠나 운영 설정을 바꾸지 않는다.

```sh
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3087 pnpm --filter docs test:e2e shell-focus-contrast.spec.ts drawer-hydration-readiness.spec.ts uiux-compact-cards.spec.ts uiux-readiness.spec.ts docs-index-readiness.spec.ts --workers=2 --retries=0
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3087 pnpm --filter docs test:e2e shell-focus-contrast.spec.ts drawer-hydration-readiness.spec.ts uiux-compact-cards.spec.ts uiux-readiness.spec.ts --grep 'shell focus|keyboard activation|compact and cards|streamed UI/UX' --repeat-each=5 --workers=2 --retries=0
```

#107의 모바일 도우미·회귀를 함께 적용한 결합 사본의 명령이다. #109의 단독 파일 범위와 구분한다. 두 번째는 각 언어·테마·프로젝트의 핵심 조건을 반복하며 기존 width sweep과 음성 회귀는 첫 명령에서 별도로 유지한다.

[스트림 도우미](../../../apps/docs/e2e/helpers/streamed-docs-index.ts)는 실제 응답 HTML을 수정하지 않고 완료 segment 앞에서 전송을 보류한다. prefix의 ui-ux pending과 suffix의 featured marker를 검증한다. wire 형식이 다르면 실패하며 가짜 본문을 실제 React root에 주입하지 않는다. 기존 docs 인덱스 wrapper는 유지한다.

## 결과와 증거

기존 검사는 main 안에 뉴스레터·input·button이 없다는 음성 조건을 먼저 검사했다. 실제 UiUxHubPending도 이 조건을 충족한다. 따라서 이 두 성공은 featured 목록이 완성됐다는 증거가 아니다. 통제 재현에서 fallback이 보이는 동안 기존 조건은 통과했고 링크는 0개였다. 전송 해제 뒤 같은 HTML에서 실제 링크 3개와 pending 제거를 확인했다.

새 readyUiUxHub는 보이는 main 중 featured 영역이 있는 본문만 선택한다. expectUiUxHubReady는 그 본문 1개·visible·pending 0개·접근 가능한 전체 main 1개를 요구한다. 그 뒤 기존 링크 3개, 이미지 크기·alt·대비 테마·카드 이름·mouse/Enter 상세 이동·feed 링크·width sweep 검사를 그대로 실행한다. 뒤로 가기에서도 같은 준비 조건을 확인한다.

새 회귀는 실제 fallback의 기존 음성 조건 통과·새 selector 0개·전송 해제 후 카드 3개·fallback 분리·키보드 실제 이동을 검사한다. 별도 빈 synthetic 페이지에서 누락 main·중복 main·남은 pending을 각각 거절하는 음성 대조를 유지한다. 이 synthetic markup은 실제 앱 DOM을 교체한 스켈레톤 검사가 아니다.

| 검사                       | 결과                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| 수정 전 두 spec 자연 반복  | 39개 통과·기존 폭 조건 3개 제외, retry 0. 최초 CI 실패 자연 미재현                                |
| 통제 조사                  | 원본 fallback이 기존 조건을 통과하고 완료 후 카드 3개가 되는 경로 확인                            |
| 수정 후 결합 검사          | 58개 통과·기존 width sweep 조건 2개 제외, retry 0, 1.3분                                          |
| 핵심 반복                  | 12조건 × 3프로젝트 × 5회 = 180개 통과, retry 0, 2.5분. UI/UX 관련 4개 소스는 코드 44137d6b와 동일 |
| 옛 main selector 음성 대조 | 격리 사본의 반환문만 getByRole('main')으로 바꾸자 ko/en 2개가 Expected 0 / Received 1로 실패      |
| 같은 두 조건 복구 후       | selector만 수정본으로 복구해 2개 통과, retry 0, 11.3초                                            |
| 타입·변경 lint             | 두 PR docs typecheck·변경 7개 ESLint 통과                                                         |

음성 대조는 새 회귀가 실제로 잘못된 selector를 차단하는지 확인하는 검사다. 격리 사본의 helpers/uiux-hub.ts에서 readyUiUxHub의 반환문만 page.getByRole('main')으로 바꾸고, 아래 명령을 실행하면 두 언어가 count에서 실패해야 한다. 앱이나 assertion을 수정하지 않는다. 이어서 자신이 변경한 반환문만 현재 PR 구현으로 복구하고 같은 명령을 재실행하면 green이 된다. 테스트 0개·서버 시작 오류는 red로 세지 않는다. 첫 red 시도는 격리 테스트 서버 시작이 겹쳐 EADDRINUSE로 실행되지 않았고, 서버 종료 확인 후 순서대로 다시 실행한 위 2개 assertion 실패만 red 결과다.

```sh
DOCS_CONTENT_SOURCE=legacy DOCS_E2E_PORT=3087 pnpm --filter docs test:e2e uiux-readiness.spec.ts --grep 'streamed UI/UX' --project=chromium-desktop --workers=1 --retries=0
pnpm --filter docs typecheck
pnpm --filter docs exec eslint e2e/uiux-compact-cards.spec.ts e2e/helpers/uiux-hub.ts e2e/helpers/streamed-docs-index.ts e2e/uiux-readiness.spec.ts --max-warnings 0
```

test 30초·expect 5초, worker 2·기존 CI retries 2를 변경하지 않았다. 조건 삭제·timeout 확대·force click·추가 sleep은 없다. 앱 데이터 선택·렌더러·운영 공급 경로는 그대로다. 원시 응답·로그·trace·화면은 공개 업로드하지 않는다. 결합 검사의 기존 docs 필터 native details hydration 경고는 별개이며 숨기거나 이번 수정의 해결 항목으로 처리하지 않는다.

## 한계와 후속 작업

확정한 것은 준비 상태 오판 경로다. 최초 CI에서 완료가 늦은 구체적인 원인까지 증명하지 못했으므로 cold compile·네트워크·hydration 중 하나로 단정하지 않는다. 로컬 재시도 없는 성공도 미래의 모든 간헐 실패가 사라졌다는 보장은 아니다. 원격 head의 CI·병합·배포와 실제 콘텐츠·실기기 검증은 별도로 기록한다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-22-uiux-stream-readiness.md)
- [기존 필터 준비 상태](2026-11-08-docs-tablet-filter-readiness.md)
