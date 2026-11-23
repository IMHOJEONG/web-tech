# 503 대조 검사의 종료 계측 준비 상태

## 대상과 조건

- 검증일: 2026-11-22 KST. [KAN-58](https://web-tech-service.atlassian.net/browse/KAN-58)의 후속 조사이며, 이전 정상 본문·background 503 공존과 이번 `responseFinished=false`는 별도 관측이다.
- 기준 main: `4b3e221b818525ba5eb73123e03b27e4d6d0596d`. 브랜치: `codex/docs-503-trace-readiness-20261122`. 코드·회귀 커밋은 `2fccc979300a7414bd2a90d436055a61516da1bd`이며 운영에 적용하지 않았다.
- Node 24.22.1·pnpm 12.14.0·Next 16.4.6·Playwright 1.62.1·macOS. 공개 코드의 격리 복사본과 합성 문서만 사용했다. 비공개 콘텐츠 저장소·NAS·실제 인증값은 읽지 않았다.
- 최초 실패: main `35c3bd83765f459dd712e4d91bf488c313ff8854`의 [CI 45005354568 attempt 1](https://github.com/IMHOJEONG/web-tech/actions/runs/45005354568/attempts/1). 모바일 `upstream-503 without navigation`에서 기대 true/관측 false, 전체 197 passed·1 failed·기존 조건부 skip 2개였다. 같은 SHA 재실행 성공을 원인 해결로 표시하지 않는다.

## 재현 방법

의존성과 Chromium이 설치된 격리된 공개 코드 복사본에서 [합성 콘텐츠 준비 절차](../../runbooks/docs-private-content-ci.md)를 따른다. 실제 원문이나 환경 파일을 복사하지 않는다. 3111·3112 포트의 다른 작업을 종료하기 전에는 production 검사를 실행하지 않는다.

```sh
DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:article:prod \
  article-e2e/completed-cause-trace.spec.ts \
  article-e2e/request-cause-next.spec.ts
DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:article:prod \
  article-e2e/request-cause-next.spec.ts \
  --grep='upstream-503 without navigation' --repeat-each=5
DOCS_CONTENT_SOURCE=legacy pnpm --filter docs test:article:prod
pnpm --filter @web-tech/ui build
pnpm --filter docs typecheck
pnpm --filter docs exec eslint \
  article-e2e/completed-cause-trace.ts \
  article-e2e/completed-cause-trace.spec.ts \
  article-e2e/request-cause-next.spec.ts --max-warnings 0
```

단독 회귀는 임시 Playwright 설정에서 `testMatch: 'completed-cause-trace.spec.ts'`, test timeout 30초·expect 10초·worker 1·retry 0으로 실행했다. Next webServer와 브라우저 프로젝트를 제외했으며 production 전체 검사로 합산하지 않는다. 합성 HTTP 서버는 고정 서비스 포트가 아닌 임의 loopback 포트를 사용한다.

아래 명령은 **Git 밖의 격리된 공개 코드 export 루트**에서 실행한다. 원문·환경 파일을 제외한 export와 의존성 설치는 위 합성 콘텐츠 준비 절차를 따른다. Node 24.22.1·pnpm 12.14.0이 PATH에 있어야 하고 loopback listen 권한이 필요하다. 이 단독 검사에는 Chromium 설치·Next 빌드·3111/3112 서버가 필요하지 않다. reporter 결과는 저장소 밖의 임시 폴더에, 기록기의 합성 JSON은 Git이 아닌 export의 `apps/docs/test-results`에 남는다. 원시 결과를 공개 Git으로 옮기지 않는다.

```sh
# standalone trace regression (repository root)
TRACE_WORK="$(mktemp -d)"
chmod 700 "$TRACE_WORK"
cat > "$TRACE_WORK/standalone.config.ts" <<'CONFIG'
export default {
    testDir: process.env.DOCS_TRACE_TEST_DIR,
    testMatch: 'completed-cause-trace.spec.ts',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    workers: 1,
    retries: 0,
    reporter: 'list',
    outputDir: process.env.DOCS_TRACE_OUTPUT_DIR,
}
CONFIG
DOCS_TRACE_TEST_DIR="$PWD/apps/docs/article-e2e" \
DOCS_TRACE_OUTPUT_DIR="$TRACE_WORK/results" \
    pnpm --filter docs exec playwright test \
    --config="$TRACE_WORK/standalone.config.ts" --repeat-each=3
```

기대 결과는 unnamed project 1개에서 **24 passed·failed 0·skipped 0·retry 0**이다. config에 `webServer`·`projects`를 추가하지 않으며, 이 24회를 두 프로젝트의 production 전체 214개로 합산하지 않는다.

리뷰 보완 뒤 이 문서의 해당 shell 블록을 그대로 추출해 격리 export 루트에서 실행한 결과는 **24 passed·32.2초·실패 0**이었다. 앞선 단독 회귀와 별도 재현 절차 검증이며 새로운 고유 테스트 수로 합산하지 않는다.

통제 순서:

1. 기존 기록기 `attachRequestCauseTrace`를 붙인 합성 HTTP 서버에서 finish/close 이벤트 전달만 Promise gate로 보류한다. Next 서버·운영 기록기에 지연을 넣지는 않는다.
2. 클라이언트는 실제 HTTP 503 응답을 끝까지 받는다. 저장 파일에는 `response-end-call`이 있고 `responseFinished=false`이며 finish 기록은 없다.
3. 보류한 기록을 한 번 읽었다는 신호를 받은 뒤 gate를 해제한다. 고정 sleep으로 타이밍을 맞추지 않는다.
4. 수정본은 같은 요청 파일에서 finish/close를 관측한 뒤 최종 판정한다. 격리 복사본의 helper만 이전 즉시 읽기 방식으로 바꾸면 같은 검사가 false에서 실패한다. 음성 대조 후 최종 helper bytes를 복원한다.

## 결과와 증거

| 항목                       | 실제 결과                                                                                | 판단                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 최초 CI 로그 재조회        | `request-cause-next.spec.ts:166`에서 true/false 실패 확인. 실행의 원격 artifact 목록 0개 | 당시 마지막 계측 파일의 종료 이벤트를 복원할 수 없다. 이후 finish 유무·실제 중단 여부는 미확정이다.                       |
| 즉시 읽기 음성 대조        | 실제 HTTP gate 검사 3회 모두 기대 true/관측 false로 실패                                 | 불완전 스냅샷을 최종 결과로 읽는 검사 결함을 통제 재현했다. 자연 발생 CI와 동일한 최초 원인이라는 뜻은 아니다.            |
| 최종 단독 회귀             | 8개 3회, 총 24회 통과, retry 0                                                           | 실제 HTTP/파일 기록, 중간 스냅샷, finish 증거, 중단·불완전 close·잘못된 JSON·영구 누락·503 전체 판정을 검사한다.          |
| 타입·변경 소스 lint        | 통과                                                                                     | 초기 UI 산출물 누락과 새 음성 대조 fixture의 readonly tuple 타입 오류를 각각 보완했다. 앱 설정·타입 기준은 바꾸지 않았다. |
| 수정 전 실제 Next 503 반복 | 두 프로젝트 각 5회, 총 10회 통과, retry 0                                                | 자연 발생 실패를 재현하지 못했다. 통제 재현과 구분한다.                                                                   |
| 수정 후 실제 Next 503 반복 | 두 프로젝트 각 5회, 총 10회 통과, retry 0                                                | 기존 503·본문·console·stream 조건을 종료 증거와 함께 통과했다.                                                            |
| production 전체            | 214 passed·기존 opt-in skip 2개, 2.5분, retry 0                                          | 기존 198개와 새 회귀 16개(8개×두 프로젝트)를 모두 통과했다. 다른 창의 3112 서버 종료 후 원래 설정으로 실행했다.           |

변경은 **증거를 읽는 준비 조건**이다. 클라이언트 수신 완료와 서버 이벤트 리스너의 JSON 갱신 완료는 서로 다른 관측점이다. 기록기는 동기 쓰기·rename을 사용하지만, 클라이언트와 서버 프로세스 간 읽기 순서까지 보장하지 않는다. `response-end-call`은 `response.end()` 실행 전의 중간 스냅샷이다.

`completedCauseTrace`는 기존 expect 10초 안에서 같은 요청의 finish 또는 close를 기다린다. close가 먼저 보이면 즉시 최종 판정하므로 취소가 성공으로 바뀔 때까지 기다리지 않는다. 잘못된 JSON은 즉시 실패하고, 종료 증거가 영구 누락되면 기존 시간 제한에서 실패한다. API 재호출·test retry·timeout 확대·skip 추가는 없다.

기존 503 acceptance assertion은 `assertUpstreamFailureTrace`로 옮겨 실제 검사와 회귀에서 공유한다. 응답 완료 true, 누락/저장 실패 0, upstream 503, 정상 본문 부재, console warning/error 존재, framework stream error 부재를 그대로 유지한다. 회귀에서는 각 조건을 하나씩 깨뜨려 실패함을 확인한다. 종료 대기는 finish 이벤트 존재도 추가 요구한다.

Artifact 상대 링크: **해당 없음**. 원시 CI 로그·요청 JSON·trace·응답은 공개 Git 밖의 제한된 임시 디렉터리에만 보관했다. 위 표는 정제 결과이며 원시 데이터 공개나 원격 CI 통과를 뜻하지 않는다. 첫 fixture 준비는 기존 앱 이미지 덮어쓰기 방지 assertion에 차단됐다. 새 격리 export에서 해당 이미지들을 제외하고 합성 이미지를 생성했으며 이 준비 실패를 앱 회귀 실패로 합산하지 않았다.

## 한계와 후속 작업

- 확인한 원인은 즉시 읽기에 종료 기록과의 동기화가 없다는 검사 설계 결함이다. 과거 CI의 정확한 사건 순서와 첫 트리거는 보관 증거 부족으로 미확정이다. 실제 서버 장애가 없었다고 단정하지 않는다.
- 단독 회귀 24회와 실제 Next의 수정 전·후 503 반복 각 10회, 수정 후 전체 214개는 실행 범위를 구분한다. 모두 macOS 로컬 결과이며 새 Linux 원격 CI·운영 검증으로 대신하지 않는다. 종료 증거 영구 누락 대조는 기존 expect 10초를 실제 소모하므로 두 프로젝트 합계 약 20초의 검사 비용이 있다.
- 앱 오류 처리·공개 API·캐시 정책·운영 계측 스키마는 변경하지 않았다. 새 ADR은 필요하지 않으며 [ADR-0008](../../architecture/adr-0008-request-lifecycle-observability.md)의 전체 운영 계측 미완료 상태도 유지한다.
- 최초 조사는 로컬 미커밋으로 마쳤다. 이후 사용자가 이번 테스트 소스 3개·정제 문서/목차 4개와 공개 검수 해시만 작업별 커밋·푸시·PR 준비하고 CI·CodeRabbit을 확인하도록 승인했다. 이 문서 검수 시점에는 원격 결과가 아직 없으며 PR·연결 이슈에서 실제 head별 결과를 구분한다. main 병합·배포·NAS·키·기존 미커밋·stash·비공개 자료는 승인 범위에 없다.
- 보존 대조에서 기준 작업 트리 38곳 중 원래 사용자 작업 트리를 포함한 37곳의 HEAD·인덱스·상태·dirty 파일 집계 해시가 일치했다. 별도 Desktop 작업 트리는 다른 세션에서 변경되어 전체 동일로 판정하지 않는다. 이번 수정은 새 작업 트리에만 있으며 stash는 0개로 동일하다. ignored 비공개 파일을 전수 읽어 검증한 것으로 주장하지 않는다.
- 공개 검수 후 [PR #110](https://github.com/IMHOJEONG/web-tech/pull/110)의 최초 head `fa9b4feed5e479ef09f28b6e9d301cee10086108`은 [CI 45034246796](https://github.com/IMHOJEONG/web-tech/actions/runs/45034246796) 13개 job·문서·CodeQL 검사를 통과했다. Linux 상세 E2E는 **214 passed·기존 skip 2개·3.9분·retry 0**이었다. CodeRabbit의 단독 재현 설정·명령 누락 의견 1건을 이 문서에서 보완하며, 후속 head의 CI는 별도 결과로 확인한다. 원시 로그·trace는 첨부하지 않는다.

## 2026-11-23 main 동기화 후속 검증

검증일은 2026-11-23 KST다. 기존 PR head `8e54a6665a62d6d358973786102e5eee1ff1baf9`에 최신 main `b841d21ad76ee64790765315932e06739d60270e`를 병합하는 과정에서 테스트 1개·목차 2개·공개 검수 목록의 충돌을 정리했다. 위 11-22 결과를 덮어쓰지 않으며, 이 절의 검수 시점에는 병합 커밋·후속 푸시·새 CI가 아직 없다.

- main의 실제 Link 스크롤·prefetch 준비 단계와 다른 종료 대조의 이벤트 검증을 보존했다. 503 대조에서는 단순 `responseFinished` polling 대신 기존 PR의 같은 요청 종료 증거 helper와 전체 acceptance 판정을 유지했다. 고정 sleep·timeout 확대·test retry·skip 추가는 없다.
- 공개 검수 목록은 main의 251개 항목과 기존 PR 보고서·worklog 2개를 경로별로 보존해 253개로 합쳤다. 경로 중복·기존 항목 삭제는 없다. 변경된 목차와 이 후속 기록의 해시는 사용자 최종 검수 후에만 갱신한다.
- 최신 main의 Git archive에서 원문·환경 파일·기존 빌드 산출물을 제외하고 합성 문서 17개를 준비했다. 아래 테스트 소스 3개의 병합 작업 파일과 격리 export의 SHA-256 일치를 재검사했다. 실제 NAS·인증값·비공개 콘텐츠 저장소·다른 작업 트리의 미커밋 파일은 검증 입력으로 사용하지 않았다.
- 환경은 Node 24.22.1·pnpm 12.14.0·Next 16.4.6·Playwright 1.62.1·macOS다. 앞의 단독 회귀 명령과 production 명령을 같은 시간 제한·worker·retry 설정으로 실행했다.

| 항목                     | 실제 결과                                                | 판단                                                                                                                                  |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 단독 종료 증거 회귀      | 24 passed·32.1초·실패 0·retry 0                          | 기존 실제 HTTP gate와 음성 조건을 모두 유지했다.                                                                                      |
| 실제 Next 503 반복       | 두 프로젝트 각 5회, 총 10 passed·30.9초·retry 0          | 충돌을 정리한 실제 Next 검사와 기존 acceptance가 함께 통과했다.                                                                       |
| 상세 production 전체     | 214 passed·기존 opt-in skip 2개·2.4분·retry 0            | main의 최신 렌더링·prefetch·검색 변경과 PR의 종료 증거 회귀가 함께 통과했다. webServer의 production 빌드도 성공했다.                  |
| 타입·변경 소스 lint·포맷 | 공용 UI 빌드 후 docs 타입, 소스 3개 ESLint·Prettier 통과 | 첫 타입 검사는 격리 환경의 UI 산출물 누락으로 실패했다. UI 빌드 후 같은 타입 기준으로 통과했으며 앱 코드·검사 기준은 수정하지 않았다. |
| 원격 CI·CodeRabbit       | 새 head는 미푸시·미검증                                  | 이전 head의 성공·한도 NEUTRAL을 이번 병합 결과로 재사용하지 않는다.                                                                   |

원시 JSON·응답·CI 로그·trace·새 artifact는 공개하지 않는다. 위 결과는 합성 입력의 로컬 병합 검증이며 과거 자연 발생 CI의 최초 원인 확정·main 반영·운영 배포를 의미하지 않는다. 별도 작업 트리 안에서만 충돌을 정리했고 원래 작업 트리의 HEAD는 `05105c177712864537fbc2615e58364e74168127`로 유지됐다. 기존 미커밋·초안·stash·NAS를 변경하지 않았으며 다른 세션의 동시 변경까지 전수 동일하다고 주장하지 않는다.

공개 검수 후 main 동기화와 정제 검증 기록을 작업별 커밋으로 나눠 현재 PR에 푸시한다. 새 head의 CI·실제 리뷰 여부·남은 범위는 PR과 Jira·Confluence에서 별도로 확인하며 KAN-58 전체를 완료 처리하지 않는다.

## 관련 문서

- [완료 증거 helper](../../../apps/docs/article-e2e/completed-cause-trace.ts) · [통제·음성 회귀](../../../apps/docs/article-e2e/completed-cause-trace.spec.ts)
- [실제 503 검사](../../../apps/docs/article-e2e/request-cause-next.spec.ts) · [계측 기록기](../../../apps/docs/article-e2e/request-cause-trace.ts)
- [이전 캐시·503 조사](2026-11-01-publication-cache-request-cause.md) · [작업 기록](../../worklog/2026-11/2026-11-22-upstream-503-trace-readiness.md)
- [Confluence 개념·판단 기준](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=20119968)
- [Node HTTP finish](https://nodejs.org/docs/latest-v24.x/api/http.html#event-finish_1) · [Playwright expect.poll](https://playwright.dev/docs/test-assertions#expectpoll)
