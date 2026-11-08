# 태블릿 필터 준비 상태와 스트리밍 교체 검증

## 대상과 조건

- 검증일: 2026-11-08 KST. 기준 main `d04a7da578d8b7631f03a53406239700c5e592f8`, 브랜치 `codex/docs-tablet-filter-stability-20261108`. 로컬 미커밋 검증이며 원격 반영·배포 완료가 아니다.
- 추적: [KAN-42](https://web-tech-service.atlassian.net/browse/KAN-42), [Confluence 후속 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=15925302).
- 최초 관측: [PR #88 CI 42362817794](https://github.com/IMHOJEONG/web-tech/actions/runs/42362817794)의 tablet/ko `docs-index-order.spec.ts` 정렬 클릭. 최초 실패 후 재시도 통과였으며 후속 CI의 flaky0을 원인 해결로 해석하지 않았다.
- 환경: macOS arm64, Node 24.22.1·pnpm 12.14.0, 설치된 Next.js·Playwright Chromium. 실제 NAS·운영 API·토큰 없이 loopback 서버와 로컬 문서를 사용했다.

## 재현 방법

완성된 checkout의 helper는 이미 수정되어 있으므로 아래 red 명령만 실행하면 실패하지 않는다. 기존 미커밋 작업을 건드리지 않도록 검증한 PR 커밋에서 별도 detached worktree를 만든다. 아래 경로가 이미 존재하면 덮어쓰지 말고 새 임시 경로를 선택한다. Node 24.22.1·pnpm 12.14.0과 Playwright Chromium 설치를 먼저 확인한다.

```sh
git worktree add --detach /tmp/docs-filter-red-green 12a0a3a5ed83a232590016397e23d5e1b81ca135
cd /tmp/docs-filter-red-green
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
```

이 격리 worktree의 `apps/docs/e2e/helpers/docs-index.ts`에서 **반환문 한 줄만** 다음 diff처럼 변경한다. 기존 main의 helper 파일 전체로 교체하면 새 spec이 import하는 `readyDocsIndex`가 없어져 컴파일 오류가 나므로 올바른 음성 대조가 아니다. 함수 export·테스트·앱·assertion은 유지한다.

```diff
-    return readyDocsIndex(page).getByTestId('docs-index-filters')
+    return page.locator('[data-testid="docs-index-filters"]:visible')
```

격리 worktree 루트에서 red를 실행한다. 기존 서버와 겹치지 않는 전용 포트와 checkout 밖 출력 경로를 사용한다. test30초·expect5초는 그대로이며 재시도는0이다.

```sh
DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs test:e2e docs-index-readiness.spec.ts --project=chromium-tablet --grep 'ko:' --retries=0 --workers=1 --output=/tmp/docs-tablet-red
```

기대 결과는 두 ko 사례가 `toHaveCount(0)`에서 `Received: 1`로 실패하는 것이다. 현재 통합본에는 열린 fallback·닫힌 fallback 사례가 각각 있어 최초 조사본의 red1과 개수가 다르다. 서버 시작·컴파일·브라우저 실행 오류 또는 테스트0개는 재현 성공이 아니다. red가 통과하면 기존 selector로 변경했는지 확인한다.

green 전에 **격리 worktree에서 자신이 변경한 한 줄만** 위 diff의 반대로 되돌린다. `git diff -- apps/docs/e2e/helpers/docs-index.ts`가 비어 있어야 한다. 사용자 작업 트리나 기존 미커밋 파일을 복원 대상으로 삼지 않는다. 먼저 같은 ko 명령을 출력 경로만 `/tmp/docs-tablet-green-same`으로 바꿔 실행하고, 이어서 전체 태블릿 및 관련 회귀를 실행한다.

```sh
DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs test:e2e docs-index-readiness.spec.ts --project=chromium-tablet --grep 'ko:' --retries=0 --workers=1 --output=/tmp/docs-tablet-green-same
DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs test:e2e docs-index-readiness.spec.ts docs-index-order.spec.ts --project=chromium-tablet --retries=0 --workers=1 --output=/tmp/docs-tablet-green
DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs test:e2e docs-index-readiness.spec.ts docs-index-order.spec.ts --grep 'fallback filters|collapsed filters' --repeat-each=10 --workers=2 --retries=0 --output=/tmp/docs-tablet-repeat
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec eslint e2e/helpers/docs-index.ts e2e/helpers/streamed-docs-index.ts e2e/docs-index-readiness.spec.ts e2e/docs-index-order.spec.ts --max-warnings 0
DOCS_E2E_PORT=3047 mise exec -- pnpm --filter docs test:e2e docs-index-navigation.spec.ts docs-index-pagination.spec.ts docs-index-order.spec.ts docs-index-readiness.spec.ts search-navigation.spec.ts --workers=2 --retries=0 --output=/tmp/docs-tablet-related
```

첫 명령의 offline 설치 시도는 새 로컬 store에 tarball이 없어 실패했다. 승인 후 같은 lockfile의 온라인 설치를 실행했다. 패키지 업그레이드·skill 승인·lockfile 변경은 하지 않았다. 첫 red 실행의 기본 error-context는 생성 후 저장소 밖으로 옮겼으며 이후 출력 위치를 명시했다. 재현 명령의 `/tmp` 경로는 독립 실행용 예시이며 원본 개인 보관 경로를 공개하지 않는다.

## 결과와 증거

### 실패 경로와 기존 PR

최초 CI call log는 링크가 unstable인 뒤 DOM에서 detached되고, 재탐색한 `sort=section` 링크가 보이지 않는 순서를 보여 준다. 이 로그만으로 특정 hydration·CPU 지연·RSC 교체 호출자를 확정하지 않는다.

현재 앱은 `DocsIndexPending`과 `DocsIndex`에서 같은 `DocsIndexControlsBar`를 렌더링한다. 따라서 로딩 골격에도 같은 test id·링크·native details가 있다. 기존 helper의 `[data-testid="docs-index-filters"]:visible`은 결과 목록 유무와 관계없이 골격을 선택한다. URL 변경 확인 역시 결과 DOM이 완성됐다는 증거가 아니다. 골격을 열고 나면 완료된 화면으로 교체될 때 해당 노드의 native open 상태는 이어지지 않는다.

같은 문제를 다룬 [PR #71](https://github.com/IMHOJEONG/web-tech/pull/71)은 조사 시점에도 OPEN·미병합이었다. 그 준비 상태 보완은 현재 main에 없었다. 새 원인이나 이미 병합한 수정의 회귀로 꾸미지 않고, 기존 KAN-42를 재사용해 최신 main과 당시 증거를 대조했다. 새 PR을 중복 생성하거나 PR #71을 임의 병합하지 않았다.

### 통제 재현과 수정

- 실제 Next HTML을 가져와 Suspense 완료 segment 앞에서만 전송을 보류한다. HTML bytes를 바꾸거나 React 소유 DOM에 가짜 skeleton을 주입하지 않는다. prefix의 pending과 suffix의 실제 결과 marker를 검사하며 wire format이 다르면 실패한다.
- 수정 전 tablet/ko에서 pending 필터가 보이고 선택 칩2개도 존재하는 동안 helper는0개여야 하는데1개를 반환해 기존 expect5초 안에 실패했다. 실패한 판정을 제거하지 않고 그대로 유지했다.
- helper를 `main:visible` 중 `docs-index-results`가 실제로 들어 있는 화면으로 제한했다. 필터 열기 후 open도 확인한다. 실제 앱·CSS·링크·데이터·CI 설정은 변경하지 않았다.
- 기존 선택 해제 동선에 칩4→3→2 확인과 실제 정렬 문구 검사를 추가했다. 최종 화면에서 필터를 열고 summary focus·Enter 닫힘을 확인한다. URL만 바뀐 이전 화면을 준비 완료로 판단하지 않는다.
- 새 회귀는 보류 상태에서 helper0개, 해제 후 fallback 노드 분리, 실제 정렬 Link 클릭과 URL·칩 문구, 포커스·키보드 닫힘을 검사한다. 고정 sleep·force click·fallback DOM 삭제·timeout 확대는 없다.

| 검사                  | 관측 결과                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------- |
| 수정 전 통제 회귀     | 1개 실패: 완성 결과가 없는데 기존 helper가 보이는 pending 필터1개를 수락                     |
| 수정 후 태블릿 집중   | ko/en의 기존 목록 배치·선택 해제와 새 통제 회귀8개 통과·retry0                               |
| ko/en·3 viewport 반복 | 핵심4조건 × 세 viewport × 10회 = 120개 통과. retry0·실패0·skip0·flaky0                       |
| 관련 탐색·검색 회귀   | 목록·선택 해제·페이지 이동·검색5개 spec, 75개 통과·기존 폭 조건6개 skip. retry0·실패0·flaky0 |
| 타입·lint             | docs typecheck·변경 테스트4개 ESLint 통과                                                    |

원본 증거는 최초 공개 CI의 call log와 로컬 실행 결과다. 원시 응답·error-context·trace·화면 캡처는 공개 artifact로 추가하지 않았다. 현재 문서의 집계는 정제된 로컬 기록이며 `.publication-review.json`의 승인 항목을 만들거나 갱신하지 않았다.

반복 실행 중 일부 완료 화면의 native `<details open>`에서 hydration attribute mismatch 경고를 별도로 관측했다. 새 helper는 최종 결과 DOM의 존재를 보장하지 React hydration 완료까지 보장하는 API는 아니다. 이번 검사에는 원래 console error0 계약이 없으며 해당 경고를 숨기거나 로그0으로 보고하지 않는다. 대상 링크 timeout은 재발하지 않았지만 경고의 제품 정책·해결은 별도 후속이다. 기존 PR #71 기록에도 native open hydration 경고의 구분이 있다.

### 기존 PR #71 통합과 공개 검수

후속 사용자 요청으로 이번 보완을 기존 PR #71에 반영한다. 기존 PR의 더 강한 칩 제거·native fallback 키보드 조작·pageerror0 검사는 삭제하지 않았다. 이번의 닫힌 fallback 대조 회귀를 독립된 ko/en 사례로 추가했다. 앞선 120/75 결과는 main 기반 조사본의 결과이며 기존 PR 통합본의 결과로 대체하지 않는다.

- 최신 main `d04a7da`와 기존 PR head `e8c6fff8`의 가상 병합은 충돌0이었다. 첫 통합 대조는 staged 공개 검사를 통과했지만, 전체 PR 이력 검사에서는 정책 도입 전4개 커밋의 manifest 부재로 차단됐다. 최종 해시만 추가해 과거 커밋 검사를 통과했다고 처리하지 않았다.
- 사용자가 옛 head 백업 후 PR #71만 최신 main 기준으로 이력을 재구성하고 `--force-with-lease`로 갱신하도록 명시 승인했다. `codex/archive-pr71-before-rebuild-20261108`을 정확한 `e8c6fff8043c1d34f0b5b11a4e22d23c5562c9cc`에 만들었다. 기존 검수 파일·더 강한 회귀를 최신 main 위의 새 커밋으로 다시 기록하며 원래 이력은 이 보관 ref에서 유지한다. main·다른 브랜치·gate·hook·CI 설정은 변경하지 않는다.
- 사용자가 기존 공개 문서·정제 집계 JSON도 재검수·해시 등록하도록 명시 승인했다. 과거 집계2개는 직접 작성한 합성 회귀의 수·실패 이력·기준 commit이며 원시 로그·실제 API 응답·캡처가 아니다. 과거 내용과 한계를 보존하고 Confluence 링크만 같은 페이지의 비개인 경로로 정리했다.
- 이력 통합·과거 자료 검수, 추가 회귀, 이번 정제 문서·해시를 작업별 커밋으로 분리한다. 소스 조사본과 기존 보안·snapshot 미커밋은 원래 위치에 그대로 둔다. 추가 원시 artifact는 공개하지 않는다.
- 결합 상태에서 ko/en × 세 viewport × 기존/닫힌 fallback·선택 해제3동선 × 10회, 핵심180개가 retry0·실패0·skip0으로 통과했다. 관련5개 spec은81개 통과·기존 모바일 전용6개 skip·retry0·실패0이다. 타입·변경4파일 lint도 통과했다. 앞선 main 조사본120/75와 실행 범위를 합산하지 않는다.
- 통합 대조본과 새 기준 커밋의 tree 동일성, 추가 회귀 소스의 bytes 동일성을 확인해 재구성이 검사한 런타임 파일을 바꾸지 않았음을 대조한다. 최종 bytes 검수와 staged·전체 전송 이력 검사를 마친 뒤 옛 head를 정확히 지정한 lease로 PR #71만 갱신한다. main 병합·운영 배포는 하지 않으며 최종 커밋·원격 CI·리뷰 결과는 연결된 KAN-42·Confluence에서 실제 SHA로 구분한다.

### 재현 절차 리뷰 후 재검증

CodeRabbit의 [재현 선행 조건 보완 의견](https://github.com/IMHOJEONG/web-tech/pull/71#discussion_r4506585653)에 따라 red용 selector 변경과 green 전 복원을 명시했다. `12a0a3a`의 격리 worktree에서 실제로 한 줄만 변경해 동일한 tablet/ko 명령으로 두 assertion 실패(`Expected: 0 / Received: 1`)를 확인했고, 한 줄 복원 후 같은 두 사례가 retry0으로 통과했다. 이어서 위 전체 태블릿 green 명령도10개 통과·retry0·실패0을 확인했다. helper diff는 비어 있으며 테스트·앱·assertion 변경은 없다. 최초 sandbox의 loopback listen 권한 오류는 테스트 미실행으로 구분하고 권한 승인 후 실행한 결과만 대조했다. 원시 출력은 checkout 밖에 보관했다.

첫 원격 검증은 [CI 42490307701](https://github.com/IMHOJEONG/web-tech/actions/runs/42490307701)과 같은 head `12a0a3a`의 문서·CodeQL·CodeRabbit·두 Preview를 포함한22개 검사 모두 성공이다. 데스크톱136개·태블릿128개·모바일142개가 통과했고 기존 조건부 제외는 각각17/25/11개다. 해당 CI의 flaky·실패 집계는0이지만 hydration 경고는 남아 있다. 이 결과를 후속 문서 커밋의 새 CI나 production 검증으로 대체하지 않는다.

## 한계와 후속 작업

- 준비 상태 오판은 통제 재현했지만 원래 CI에서 교체를 발생시킨 최초 호출자는 trace 부재로 미확정이다. 모든 브라우저의 서비스 장애로 일반화하지 않는다.
- 실제 fallback을 사용자가 열었을 때 상태를 보존하는 제품 정책이나 native details의 hydration 경고를 해결하는 앱 변경은 이번 범위가 아니다.
- Chromium의 viewport·touch 설정 검사이며 Safari·Firefox·실기기·production 서버·원격 CI는 별도 검증이다. 임의의 retry·skip 추가 없이 실행 결과를 구분한다.
- 후속 사용자 요청에 따라 기존 PR #71을 갱신하며 새 PR은 만들지 않는다. 옛 head 백업과 해당 PR의 lease 갱신만 승인된 이력 변경 범위다.
- 기존 보안 후속 문서2개·snapshot 문서2개·조사본·stash·실제 NAS 설정과 자격 증명은 보존한다. 초기 조사 결과와 후속 공개 커밋·원격 검사·미실행 운영 배포를 구분한다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-11/2026-11-08-docs-tablet-filter-readiness.md)
- [최초 태블릿 실패 기록](../security/2026-11-07-dependabot-advisories.md)
- [로컬 목록 배치 검증](../accessibility/2026-10-19-docs-index-order-local.md)
- [공개 검수 절차](../../process/publication-review.md)
- 로컬 설치 문서 `apps/docs/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`와 `01-app/01-getting-started/04-linking-and-navigating.md`에서 fallback 교체와 streaming·Link 경계를 확인했다. 의존성 내부 경로를 저장소 상대 링크처럼 만들지 않는다.
