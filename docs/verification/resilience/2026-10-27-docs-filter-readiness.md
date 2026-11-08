# 문서 인덱스 필터의 스트리밍 준비 상태 검사

## 대상과 조건

10월 28일 사용자 승인으로 최신 main `e2126a40` 기반 독립 PR에 분리했다. 아래 Node 24.12.0·미커밋 표현과 실행 횟수는 10월 27일 원본 기록이다. 기존 PR #67의 스켈레톤 소스·설명은 중복 포함하지 않는다. 이번 재검증은 별도 구역으로 구분한다.

- 날짜: 2026-10-27 Asia/Seoul. [KAN-42](https://web-tech-service.atlassian.net/browse/KAN-42).
- 기준: [PR #67](https://github.com/IMHOJEONG/web-tech/pull/67) head `9923d815fb48220b3c95f01784c6a452567e4470` 이후 로컬 미커밋 보완. NAS/H1/대비 작업은 다른 작업 트리에 보존한다.
- 원격 증거: [CI 40438706168 desktop](https://github.com/IMHOJEONG/web-tech/actions/runs/40438706168/job/121973567506)의 영문 `collapsed filters keep selections visible and independently clearable` 1건. 재시도 후 workflow는 성공했지만 첫 attempt는 정렬 링크 클릭에서 30초 timeout이었다.
- 환경: Node 24.12.0, pnpm 12.14.0, Next 16.4.3 development, Playwright 1.62.1 Chromium. 원격 목록 비활성화, loopback 3027, viewport 390×844 / 768×1024 / 1280×800, ko/en.

## 재현 방법

잠긴 의존성을 설치한 저장소 루트에서 실행한다. 3027 포트의 기존 사용자 서버는 종료하지 않는다. Playwright가 테스트 서버를 시작하거나 이 작업용 서버를 재사용한다.

```bash
DOCS_E2E_PORT=3027 mise exec -- pnpm --filter docs exec playwright test e2e/docs-index-order.spec.ts e2e/docs-index-readiness.spec.ts e2e/docs-index-navigation.spec.ts --workers=2 --retries=0
DOCS_E2E_PORT=3027 mise exec -- pnpm --filter docs exec playwright test e2e/docs-index-order.spec.ts e2e/docs-index-readiness.spec.ts --grep 'collapsed filters|filter readiness' --repeat-each=10 --workers=2 --retries=0
```

새 회귀 검사는 `holdDocsIndexCompletion`으로 실제 서버 HTML을 받아 그대로 두 구간에 나눠 전송한다. 가짜 골격/본문을 만들거나 React DOM을 직접 교체하지 않는다. 첫 hidden streaming segment 직전에서 응답을 보류하고, 실제 골격과 칩이 보이는 동안 완성 화면 selector가 0개인지 검사한다. 네이티브 summary에 focus를 주고 Enter로 연 뒤 나머지 응답을 전달하여 골격 노드가 제거되는지 확인하고, 완성된 필터에서 실제 클릭 정렬과 Enter 접기를 검사한다. 임의 sleep이나 클릭 재시도는 없다.

이 중계는 loopback 임의 포트에만 바인딩한다. Next의 streaming segment 형식에 의존하므로 버전 변경 시 전송 경계를 재검토한다. 예상한 골격·완성 markup이 없으면 실패시키며 검사를 skip하지 않는다.

## 결과와 증거

정제한 실행 결과는 [artifact](../artifacts/2026-10-27-docs-filter-readiness.json)에 둔다.

### 원인 조사

1. CI call log는 `a[href*="sort=section"]`의 `not stable → detached → not visible` 순서를 기록했다. 태그/모음 해제 URL은 맞았으나 정렬 링크 노드가 교체됐고 재탐색한 대상은 보이지 않았다. 원격에서 details 전체가 교체됐는지는 trace가 없어 확정하지 않는다. timeout이나 영문 번역 누락 자체가 원인이라는 증거는 없다.
2. 기존 helper는 `[data-testid="docs-index-filters"]:visible`만 사용했다. `DocsIndexPending`과 `DocsIndex`는 같은 controls/active-filters를 렌더링하므로, visible 및 칩 개수 4 조건은 완성된 결과를 보장하지 않았다. URL 검사만으로도 이후 화면의 commit 완료를 증명할 수 없다.
3. 일반 속도에서 수정 전 기존 검사 20회는 모두 통과했다. CPU 6배 지연의 별도 읽기 전용 계측 8회도 기능 실패는 없었지만 일부 reload에서 pending 필터가 초기 칩 검사를 만족했다. 통과 횟수를 원인 해소로 사용하지 않았다.
4. 실제 서버 HTML 분할 실험에서 골격 details를 열면 `open`이 있었고, 나머지 응답 후 기존 노드는 `isConnected=false`, 새 필터의 `open`은 없었다. 이전 스켈레톤 문제와 달리 테스트가 React DOM을 바꾸지 않아도 발생하는 정상 스트리밍 교체다.
5. 원격 첫 실패 attempt의 trace는 보관되지 않았다. 따라서 CI의 교체 호출자나 당시 정확한 전송 순서를 단정하지 않는다. 확인한 것은 기존 selector가 교체될 골격을 준비 완료로 오인하는 결함과 동일한 detach/접힘 경로의 로컬 재현이다. 전체 서비스 장애·원격 API 실패·영문 전용 제품 버그로 일반화하지 않는다.

### 보완과 검증

- 완성 결과 section을 포함하는 visible main 안에서만 필터와 선택 칩을 찾는다. 단순히 DOM 개수를 첫 번째로 잘라서 중복 오류를 숨기지 않는다.
- URL assertion은 유지하고 태그 해제 후 3개, 모음 해제 후 2개, 정렬 후 실제 Web/Section 선택까지 확인한다. summary focus 및 열림을 확인한 뒤 Enter의 닫힘을 검사한다.
- 정렬 후에도 이전 native details의 열림 상태가 보존된다는 제품 계약은 없다. 새 화면에서 helper의 정상 summary 클릭으로 열림을 명시한 뒤 Enter를 검사한다. 실패한 클릭을 다시 누르는 retry loop나 `force`, DOM `.open` 대입을 사용하지 않는다.
- 초기 보완 검사: 27 통과·6 기존 viewport 조건부 제외, 실패/flaky/retry 0. 이후 10반복 검사에서는 107 통과·13 실패였다. 이 중 5건은 Flight bootstrap보다 먼저 hidden 결과가 전달될 수 있다는 중계 도구의 가정 오류였고, 7건은 새로 추가한 정렬 후 open 유지 가정에서 실패했다. 나머지 timeout 및 cleanup 오류도 중간 실패로 보존한다.
- 중계 경계를 첫 hidden segment로 앞당기고, 페이지가 닫혔더라도 서버 연결을 정리하도록 보완했다. 이 단계의 3반복은 35 통과·1 실패였으며, 새 fixture가 의도적으로 완료하지 않은 문서에서 골격 summary의 pointer 안정성 대기가 timeout이었다. 골격 조작은 focus/Enter로 네이티브 동작을 증명하도록 한정하고, 기존 검사와 완성 필터의 실제 클릭은 유지했다. 이 중간 실패도 숨기지 않는다.
- 최종 두 언어·세 viewport·기존 필터/신규 스트림 검사 각각 10반복: 120 통과, 실패/skip/flaky/retry/runner error 0, 137.2초. 신규 검사에는 `pageerror`가 비어 있는지도 포함했다.
- 옛 selector 한 줄만 임시 복원한 음성 대조: desktop en 신규 회귀 1개가 5초 expect에서 `expected 0 / received 1`로 실패했다. 동일 골격을 잘못 준비 완료로 읽는 결함을 회귀가 차단한다. 보완 selector로 즉시 복원했다. 최초 대조 명령은 과도하게 좁힌 grep 때문에 0개만 선택됐으므로 그 실행은 결함 검증으로 사용하지 않았다.
- 보완 selector 복원 후 관련 7개 spec: 122 통과·10 기존 viewport 조건부 제외, 실패/flaky/retry/runner error 0, 82.1초. 스켈레톤/격리 75개, 인덱스 순서/필터 18개, 새 스트림 6개, 모바일 이동 3개, 터치 2개, 허브 필터 18개가 통과했다. 제외 10개는 원래의 모바일 전용 이동 6개·터치 4개이며 새 skip은 없다. 앞선 120반복과 겹치는 검사를 독립 테스트 수로 합산하지 않는다.
- 타입 검사와 변경 TypeScript 4파일의 ESLint `--max-warnings=0`은 통과했다. 문서 delta·포맷·diff 검사도 통과했다. `GIT_INDEX_FILE` 임시 인덱스에 이번 파일만 넣어 `pnpm validate:docs --staged`와 `pnpm format:staged:check`를 실행했고 실제 인덱스는 비워뒀다.
- [Jira 검증 표](https://web-tech-service.atlassian.net/browse/KAN-42?focusedCommentId=10032)는 헤더 포함 5행 모두 3열인 것을 재조회했다. Confluence v166은 이전 본문 보존·새 항목 1개·링크를 재조회했고, 미커밋 결과와 기존 PR/CI를 구별했다.

기존 30초 test / 5초 expect, CI retry 2, 원래 URL·칩 수·독립 해제·Enter 닫힘·기하/overflow 기준은 낮추지 않았다. 앱 코드·문구·CSS·의존성·CI 설정은 변경하지 않았다.

## 한계와 후속 작업

### 2026-10-28 main 기반 독립 재검증

Node 24.22.1·pnpm 12.14.0, main `e2126a40`에서 같은 소스를 분리했다. 핵심 두 spec의 ko/en·세 viewport를 각각 3회 실행해 **36 통과·실패/skip/retry 0**이었다. 목록 순서·스트림·탐색·페이지네이션·터치·허브 6개 spec은 **65 통과·10 기존 조건부 제외·실패/retry 0**이다. 두 실행은 겹치므로 고유 테스트 수로 합산하지 않는다. 전용 변경 4파일 ESLint와 docs 앱 타입 검사도 통과했다. [실행 명령과 결과](../artifacts/2026-10-28-docs-filter-main-recheck.json).

관련 실행 중 native fallback details의 `open` 속성에 대한 React hydration 경고도 관측했다. 의도적으로 완료 전 골격을 여는 재현 조건과 관련된 경고이며, pageerror 0/테스트 통과를 모든 hydration 경고 해소로 표현하지 않는다. 앱 경고 원인의 독립 확정·Production/Safari/실기기 검증은 남아 있다. 기존 PR #67의 스켈레톤 코드는 이 PR에 포함하지 않았다.

- 로컬 결과와 원격 재검증·병합·배포를 구분한다. 이번 변경은 아직 커밋/푸시하지 않았다.
- Chromium 에뮬레이션이며 Safari/Firefox/실기기·Production 성능은 미검증이다.
- 이 작업은 테스트의 준비 상태와 시나리오 선행 조건을 보완한다. 모든 hydration 문제를 해결하거나 제품의 필터 펼침 영속 정책을 추가한 것은 아니다.
- ADR-0003의 문서 탐색 역할과 로딩 정책은 유지한다. 새 제품/공용 컴포넌트 계약이 없으므로 ADR을 추가하지 않는다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-27-docs-filter-readiness.md)
- [로딩 정책](../../architecture/docs-loading-ux-policy.md)
- [필터 준비 상태의 재사용 지식](../../knowledge/docs-app/streamed-index-readiness.md)
- [기존 PR #67의 스켈레톤 검사 기록](https://github.com/IMHOJEONG/web-tech/blob/9923d815fb48220b3c95f01784c6a452567e4470/docs/verification/resilience/2026-10-27-skeleton-runtime-isolation.md)
