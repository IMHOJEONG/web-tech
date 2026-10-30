# 스켈레톤 기하 검사와 페이지 런타임의 경합 안정화

## 대상과 조건

- 날짜: 2026-10-27 Asia/Seoul. [KAN-40](https://web-tech-service.atlassian.net/browse/KAN-40).
- 기준: main `e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e`, 별도 `codex/docs-skeleton-stability-20261027`에서 10-27 실험 당시의 로컬 미커밋 보완. 이후 저장소 커밋·main 통합 준비는 아래 후속 기록에서 구분한다. 기존 NAS/H1/대비 작업은 원래 작업 트리에 보존했다.
- 원격 관측: [main CI 40352593284 desktop](https://github.com/IMHOJEONG/web-tech/actions/runs/40352593284/job/121676369322)의 light `/feed`·`/mobile` 2 flaky. 각각 주입한 pending을 기다리는 `evaluate`와 비어 있지 않은 상태 안내 검사에서 요소가 사라졌다. workflow는 재시도 후 성공했다.
- 로컬: Node 24.12.0·pnpm 12.14.0·Playwright 1.62.1·Next 16.4.3 development, 원격 목록 비활성화, loopback 3027. CPU 6배 지연은 DevTools의 인위적인 스케줄링 실험이며 NAS/Production 성능 측정이 아니다.

## 재현 방법

저장소 루트에서 잠긴 의존성을 설치한다. 로컬 원본 화면과 정적 측정 페이지에 같은 viewport/테마/reduced-motion을 적용한다. 기본 검사와 stress 검사는 다음과 같다.

```bash
DOCS_E2E_PORT=3027 mise exec -- pnpm --filter docs exec playwright test e2e/page-skeletons.spec.ts e2e/skeleton-snapshot.spec.ts --project=chromium-desktop --project=chromium-mobile --project=chromium-tablet --workers=2 --retries=0
DOCS_E2E_PORT=3027 DOCS_SKELETON_CPU_RATE=6 mise exec -- pnpm --filter docs exec playwright test e2e/page-skeletons.spec.ts e2e/skeleton-snapshot.spec.ts --project=chromium-desktop --repeat-each=3 --workers=2 --retries=0
```

`DOCS_SKELETON_CPU_RATE`는 테스트 전용이며 기본값 1이다. CI의 retry·timeout·프로젝트·skip 설정을 바꾸지 않았다. `runtime-diagnostic`에는 원본 페이지의 HMR/이동·DOM 제거 메타데이터, `skeleton-layout`에는 좌표·overflow·모션 결과를 남긴다. 실제 토큰/헤더/본문을 진단 필드로 저장하지 않는다.

수정 전 방식의 진단을 반복하려면 별도 디렉터리에서 기준 커밋과 [진단 패치](../artifacts/2026-10-27-skeleton-live-dom-diagnostic.patch)를 사용한다. 원본 작업 트리를 되돌리지 않는다. 저장소 루트에서 시작하며 아래 3029 포트를 비워둔다.

```bash
(
  set -eu
  SOURCE_ROOT="$(git rev-parse --show-toplevel)"
  TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/web-tech-skeleton-baseline.XXXXXX")"
  BASELINE="$TEMP_ROOT/worktree"
  printf '진단 worktree: %s\n' "$BASELINE"
  git worktree add --detach "$BASELINE" e8ab3bd6bc6c0f6ee890b05fa244cf9d040dc16e
  git -C "$BASELINE" apply --unidiff-zero "$SOURCE_ROOT/docs/verification/artifacts/2026-10-27-skeleton-live-dom-diagnostic.patch"
  cd "$BASELINE"
  mise exec -- pnpm install --frozen-lockfile --ignore-scripts
  DOCS_E2E_PORT=3029 DOCS_SKELETON_CPU_RATE=6 mise exec -- pnpm --filter docs exec playwright test e2e/page-skeletons.spec.ts --project=chromium-desktop --repeat-each=3 --workers=2 --retries=0
)
```

진단 패치는 첫 import만 바꾸는 0-context hunk이므로 `--unidiff-zero`가 필요하다. e8ab3bd의 임시 worktree에서 이 옵션을 포함한 `git apply --check`를 통과했다. 정확히 7건의 실패를 보장하는 재현기가 아니라 스케줄링 경합을 관측하는 반복 실험이다.

괄호 안의 `set -eu`는 저장소 조회·임시 디렉터리·worktree 생성·패치·이동 중 실패 시 설치/테스트 전에 중단한다. 부모 셸의 디렉터리·옵션은 유지한다. 진단 디렉터리는 결과 확인을 위해 보존하며 자동 삭제하지 않는다.

## 결과와 증거

정제한 결과는 [artifact](../artifacts/2026-10-27-skeleton-runtime-isolation.json)에 연결한다. 실패한 중간 실행과 최종 실행을 구분한다.

### 수정 전 조사

1. 문제 두 경로만 일반 속도 20회: 모두 통과. 같은 두 경로만 CPU 6배 지연 20회: 모두 통과. 반복 통과만으로 CI 원인을 해소했다고 판단하지 않았다.
2. 기존 live DOM 방식을 유지하고 전체 경로를 교차 실행한 CPU 6배 지연 69회: 62 통과·7 실패·retry/skip/flaky 0. 실패한 실행을 성공으로 덮지 않는다.
3. MutationObserver는 고정 골격의 제거와 완성된 `main` 복귀를 관측했다. Mobile의 React hydration 오류에는 테스트가 추가한 `aria-busy`, `data-page-pending="mobile"`, `span[role=status]`가 예상 트리와 다른 요소로 나타났다. 일부 실패에는 Fast Refresh rebuilding/done도 동반했다.
4. 따라서 확인한 결함은 테스트가 React가 소유한 DOM을 직접 교체해 늦은 hydration/트리 재생성과 경합한 것이다. 보이는 완성 화면·`document.fonts.ready`는 hydration 완료 신호가 아니다. 42개 animation/405px 앵커 차이도 같은 실험에서 발생했지만 각각의 CSS 변경 호출자까지 식별한 것은 아니다.
5. 원격 첫 실패 attempt의 trace는 보관되지 않았다. 로컬에서 같은 실패군과 hydration 충돌을 확인했지만, 원격 두 건의 DOM 변경 호출자를 HMR·stream 복구 중 하나로 확정하지 않는다. 사용자 화면이 사라졌거나 원격 API가 실패한 증거도 아니다.

### 보완과 재검사

- 서버가 보낸 실제 골격을 완성 화면의 셸 복사본에 배치하고 별도 페이지에서 측정한다. 원본 React root는 수정하지 않는다.
- CSS·폰트·viewport·테마는 보존하고, 별도 페이지에서만 스크립트 제거와 실행 차단을 적용한다. 원본이 이미 로드한 CSSOM을 stylesheet 순서/미디어 규칙대로 복제하고 상대 font/image URL은 stylesheet URL 기준으로 절대화한다. CSS import나 누락 스타일은 조용히 무시하지 않고 실패시킨다.
- 기존 기하/접근성/모션/오류 assertions는 유지한다. 추가 회귀는 원본 main 동일성·스크립트 요청 0·늦은 원본 변경과 별도 문서의 스크립트 실행 차단·골격 누락의 명시적 실패를 검사한다.
- 초기 신규 회귀에서 main 전체 HTML 불변을 요구해 정상 Next Image placeholder 제거까지 실패로 잡았다. 이 신규 검사 가정을 노드 동일성으로 수정했다. 초기 보완 실행은 72 통과·3 실패로 남기며, 이 중 상세 snapshot load timeout 1건도 보존한다.
- CSSOM 복제 전 중간 CPU 검사에서는 75개가 통과했지만, 세 viewport 관련 회귀는 184 통과·12 조건부 제외·2 실패였다. 실패한 두 desktop snapshot은 `load` 대기였다. 리소스 진단 46개에서도 45 통과·1 실패이며 `stylesheet:/_next/static/chunks/...css` 대기를 확인했다. 중간 75개 통과를 최종 안정화로 판단하지 않는다.
- 따라서 개발 CSS chunk URL을 새로 요청하지 않고 로드된 규칙 자체를 고정했다. `load`·폰트 완료·기존 30초/5초 기준은 유지하고 지연 리소스를 생략하는 것으로 성공 처리하지 않는다.
- CSSOM 단계의 CPU 6배 지연 3반복은 75 통과·실패/skip/flaky/retry/runner error 0, 132.9초였다. 골격 좌표 66표본의 좌측/폭 차이·overflow·애니메이션·지정 앵커 최대 차이는 모두 0이었다. 나머지 9개는 홈 경계 3개와 신규 격리 회귀 6개다.
- 다만 CSSOM 단계의 확장 검사는 다시 184 통과·12 제외·2 실패였다. 그중 320px 복합 검색 골격은 `PretendardVariable...woff2` 재요청의 load 대기였다. 다른 1건은 기존 태블릿 en 필터의 Enter 접기이며 이번 코드 변경 밖의 별도 관측이다. 이 결과를 골격 75개 단독 통과와 섞지 않는다.
- 최종 보완은 원본 화면의 font 응답 body를 캡처해 동일 URL의 정적 측정 요청에 그대로 재사용한다. 가짜 폰트/시스템 폰트 대체가 아니고, 캡처되지 않은 폰트 요청은 실패한다. CSS·폰트 원본을 새로 만들거나 Next의 내부 chunk 경로를 하드코딩하지 않는다.
- 이 보완의 세 viewport 골격/격리 검사: 75 통과·실패/skip/flaky/retry/runner error 0, 51.9초. 실제 전환 관련 확장 검사는 별도 결과로 기록한다.
- 최종 관련 198개: 186 통과·12 기존 프로젝트 조건부 제외·실패/flaky/retry/runner error 0, 130.9초. 이 실행에 포함된 골격 좌표 66표본의 좌측/폭 차이·overflow·애니메이션·지정 앵커 최대 차이는 모두 0이었다. 검색·태그/모음 해제·필터·대표/최근 카드·UI/UX·이동 회귀도 포함된다.
- 앞서 실패한 기존 태블릿 en 필터 Enter 검사도 마지막 관련 실행에서는 통과했다. 해당 코드나 기대값은 바꾸지 않았고 간헐 실패의 원인 해결을 선언하지 않는다. 문서의 실패 이력과 후속 점검 범위로 남긴다.
- 최종 폰트 재사용 소스의 CPU 6배 지연·전체 경로 3반복: 75 통과·실패/skip/flaky/retry/runner error 0, 102.2초. 실제 66개 기하 표본의 좌표/overflow/애니메이션/지정 앵커 차이 0을 다시 확인했다. 해당 75개와 관련 198개는 중복 표본을 포함하므로 독립 테스트 수로 더하지 않는다.
- 최종 타입·변경 파일 ESLint(`--max-warnings=0`)·포맷·문서 delta·diff 검사를 통과했다. 문서/포맷은 별도 `GIT_INDEX_FILE`에 이번 파일만 담아 `--staged` 읽기 전용 검사로 검증했고 실제 인덱스는 비워뒀다. 최초 `validate:docs --base HEAD`는 커밋 간 비교라 미커밋 증거로 사용하지 않는다.

## 한계와 후속 작업

이 보고서와 artifact의 `local-uncommitted`는 실험 당시의 관측 상태다. 후속 작업별 커밋 단계에서는 [테스트 커밋 7a5ecae](https://github.com/IMHOJEONG/web-tech/commit/7a5ecae329d03fb0901ca5ed825b95ef5f0a094e)의 소스4개 blob 일치·핵심4개 재검사·타입/lint/훅 통과를 확인했다. 원격 CI 결과를 앞선 로컬 실행 수치로 대체하지 않고 PR·Jira·Confluence에 별도로 기록한다.

로컬 검증과 새 원격 CI·병합·배포를 구분한다. 실제 사용자 전환의 모든 hydration 문제·운영 CLS·Safari/Firefox·실기기까지 해결했다고 주장하지 않는다. 앱 코드·원문·캐시·공용 UI·CI 기준·의존성/lockfile은 변경하지 않는다.

## 관련 문서

### 2026-10-28 최신 main 통합 재검증

사용자의 잔여 PR 정리 요청으로 기존 PR #67에 main `e2126a40`을 통합할 준비를 했다. 원본 dirty 작업 트리는 건드리지 않고 별도 준비 브랜치에서 목차 3곳의 충돌만 양쪽 보존으로 해결했다. 스켈레톤 테스트 4파일은 원래 `9923d815`와 같고, 다른 미커밋 필터 소스는 포함하지 않았다.

Node 24.22.1에서 모바일·태블릿·데스크톱, 라이트/다크 기하와 격리 두 spec이 **75 통과·실패/skip/retry 0**이었다. 앱 타입 검사·변경 파일 ESLint도 통과했다. [실행 명령·결과](../artifacts/2026-10-28-skeleton-main-recheck.json)는 앞선 10-27 원본을 대체하지 않는다. 원격 CI·실기기·Production/CLS 검증과 main 병합은 별도다.

- [그림으로 보는 hydration과 DOM 소유권](../../knowledge/docs-app/hydration-readiness-and-dom-ownership.md): 화면 표시/폰트/React 준비의 차이와 일반 원인·확인 사실 구분.

- [로딩 정책](../../architecture/docs-loading-ux-policy.md)
- [기존 골격 기하 검사](../accessibility/2026-10-19-page-skeletons-local.md)
- [작업 기록](../../worklog/2026-10/2026-10-27-skeleton-runtime-isolation.md)
