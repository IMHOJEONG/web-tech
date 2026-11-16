# Docs E2E 계측과 범위 유지형 성능 대조

## 목적과 준비 조건

데스크톱 E2E의 단계별 비용을 확인한 뒤 샤드와 worker 수를 비교한다. 테스트를 줄이거나 assertion·timeout·retry를 바꾸지 않는다. 기본 CI와 Playwright 설정을 바꾸지 않는 로컬 실험 도구이며, CI 개선 채택의 증거를 자동으로 대신하지 않는다.

- 저장소가 고정한 Node·pnpm과 설치된 Playwright Chromium을 사용한다. 루트에서 frozen lockfile로 설치하고 기존 content-contract·UI build를 완료한다.
- 실험 중 테스트·설정·의존성을 수정하지 않는다. 같은 소스 기준과 작업 diff를 기록하고 다른 브라우저 검사·빌드의 동시 실행을 피한다.
- 원시 로그·화면·trace·JSON은 저장소 밖의 비공개 디렉터리에 둔다. 도구는 checkout 내부 및 내부를 가리키는 디렉터리 symlink를 거부하고, 샘플 디렉터리는 700·로그와 집계 파일은 600으로 생성한다. 기존 샘플을 덮어쓰지 않는다.
- 전용 loopback 포트가 비어 있는지 확인한다. 사용자의 기존 개발 서버를 종료하거나 재사용하지 않는다. 운영 API·NAS·인증 값은 필요 없다.

## 실행 순서

모든 명령은 저장소 루트 기준이다. 출력 디렉터리에는 이미 사용한 이름을 반복하지 않는다.

```sh
pnpm install --frozen-lockfile
pnpm --filter @web-tech/docs-content-contract build
pnpm --filter @web-tech/ui build
export PRIVATE_RESULTS="$(mktemp -d "${TMPDIR:-/tmp}/docs-e2e.XXXXXX")"

# 전체 3개 화면 목록과 두 샤드의 합집합·중복 검사. 서버는 실행하지 않는다.
node apps/docs/scripts/measure-e2e.ts list "$PRIVATE_RESULTS/list-all" --project all
node apps/docs/scripts/measure-e2e.ts list "$PRIVATE_RESULTS/list-a" --project all --shard 1/2
node apps/docs/scripts/measure-e2e.ts list "$PRIVATE_RESULTS/list-b" --project all --shard 2/2
node apps/docs/scripts/measure-e2e.ts compare "$PRIVATE_RESULTS/list-check" \
  "$PRIVATE_RESULTS/list-all/1/timing.json" \
  "$PRIVATE_RESULTS/list-a/1/timing.json" \
  "$PRIVATE_RESULTS/list-b/1/timing.json"

# 같은 desktop 전체 목록. test.step 계측만 끄고/켜서 각각 반복한다.
node apps/docs/scripts/measure-e2e.ts run "$PRIVATE_RESULTS/off" --workers 2 --steps off --repeat 3
node apps/docs/scripts/measure-e2e.ts run "$PRIVATE_RESULTS/on" --workers 2 --steps on --repeat 3
node apps/docs/scripts/measure-e2e.ts compare "$PRIVATE_RESULTS/step-check" \
  "$PRIVATE_RESULTS/off/1/timing.json" "$PRIVATE_RESULTS/on/1/timing.json"

# 두 샤드는 각각 실행하고 결과를 함께 검증한다.
node apps/docs/scripts/measure-e2e.ts run "$PRIVATE_RESULTS/shard-a" --shard 1/2
node apps/docs/scripts/measure-e2e.ts run "$PRIVATE_RESULTS/shard-b" --shard 2/2
node apps/docs/scripts/measure-e2e.ts compare "$PRIVATE_RESULTS/shard-check" \
  "$PRIVATE_RESULTS/on/1/timing.json" \
  "$PRIVATE_RESULTS/shard-a/1/timing.json" "$PRIVATE_RESULTS/shard-b/1/timing.json"

node apps/docs/scripts/measure-e2e.ts run "$PRIVATE_RESULTS/w1" --workers 1 --repeat 3
node apps/docs/scripts/measure-e2e.ts run "$PRIVATE_RESULTS/w4" --workers 4 --repeat 3
node apps/docs/scripts/measure-e2e.ts compare "$PRIVATE_RESULTS/worker-check" \
  "$PRIVATE_RESULTS/on/1/timing.json" "$PRIVATE_RESULTS/w4/1/timing.json"
```

`--port` 기본값은 3078, `--project`는 chromium-desktop이다. 모바일·태블릿 또는 all을 명시할 수 있다. `--repeat`는 최대 3회다. 비교 명령의 candidate 여러 개는 반복 샘플이 아니라 **서로 다른 샤드**다. 반복 샘플은 각각 baseline과 비교한다.

`--steps off`에서도 같은 custom reporter가 API 집계를 수행한다. 따라서 on/off 대조는 `test.step` 구간 계측 비용을 보기 위한 것이며 reporter 전체 비용을 분리하는 실험은 아니다. 단계 계측은 `DOCS_E2E_TIMING_STEPS=1`일 때만 활성화되고 기본 테스트 실행에는 reporter를 추가하지 않는다.

각 샘플은 `command.json`에 준비·서버 기동을 포함하는 외부 명령 경과 시간을, `timing.json`에 Playwright runner 시간·ID 목록·시도별 상태·단계별 count/합계/최댓값을 기록한다. 둘의 차이는 CPU 시간이나 순수 서버 기동 시간으로 해석하지 않는다. 단계 합계와 API 합계는 서로 겹치며 병렬 worker 시간도 포함하므로 더해서 벽시계 시간이라고 하지 않는다. API 이름을 확실히 분류할 수 없으면 other로 남긴다.

`command.json`의 startedAt/endedAt·wallDurationMs도 함께 보관해 시스템 절전·중단 구간과 대조한다. wall과 monotonic 시간 차이만으로 모든 절전을 자동 감지할 수 있는 것은 아니다. macOS 로컬 검사는 필요하면 `caffeinate -i node ...`로 **해당 프로세스가 살아 있는 동안만** 유휴 절전을 막는다. 덮개 닫힘·강제 절전까지 방지하는 보장은 없으며 시스템의 영구 절전 설정은 바꾸지 않는다. CI나 다른 OS에 이 명령을 적용하지 않는다.

샤드를 같은 컴퓨터에서 순차 실행하면 목록·동작 보존은 검사할 수 있지만 독립 CI 실행기 분산의 속도 향상은 입증할 수 없다. 한 checkout에서 서버 2개를 동시에 실행하면 `.next`를 공유하므로 분산 대조군으로 쓰지 않는다. CI 실험은 검토된 별도 작업으로 진행하고 모든 샤드 성공·집계 실패 gate를 유지한다.

## 기대 결과

### 독립 GitHub CI 실험

실험 전용 `Docs E2E Sharding Experiment`는 승인한 `codex/docs-desktop-e2e-timing-20261115`의 같은 저장소 Draft PR에만 실행한다. 기존 `CI`의 모바일·태블릿·데스크톱·article·CRP matrix와 종합 Test gate는 그대로 둔다. 실험 workflow를 main의 필수 검사로 활성화하거나 Production 배포를 실행하지 않는다.

- PR head SHA를 모든 job에서 동일하게 checkout한다. 공식 Playwright 이미지 digest·Node 보안 pin·frozen lockfile·기존 pnpm cache를 유지하고 `.next`는 공유하지 않는다.
- 기준 전체와 shard1/2·2/2를 각각3회, 총9개 독립 `ubuntu-latest` job에서 실행한다. worker2·CI retry2·timeout30초·expect5초·서버 준비120초·기존 케이스별120초 예외·trace 계약은 그대로다.
- 동시 job은 최대3개다. matrix 순서는 회차별로 바꾸지만 스케줄러의 동시 시작·정확한 순서까지 보장하지 않는다. 실제 queue와 job 시작/종료 시각은 GitHub API로 별도 확인한다.
- 원시 콘솔·HTML report·trace·화면은 runner 임시 경로에만 남고 업로드하지 않는다. 공개 승인한 이 실험에서만 엄격한 스키마로 새로 만든 ID/파일 hash·고정 상태/실패 분류·숫자·도구 버전·자원 등급 집계를 전달한다. 기존 원시 증거 업로드 변수는 활성화하지 않는다. 오류 본문·URL·선택자·응답·사용자 입력은 포함하지 않는다.
- 집계는 정확히9개 sample·독립 runner hash·동일 SHA/Node/Playwright/CPU/메모리 GiB 등급·기존 판정 계약을 검사한다. 전체 manifest와 샤드 합집합, status·expectedStatus·skip을 대조한다. retry로 통과한 실행도 benchmark 채택 표본에서는 거부하며 원래 CI retry 설정은 유지한다.
- 누락·실패·retry·자료 검증 실패는 집계 실패다. `always()`에서 결과를 확인하되 `continue-on-error`로 통과시키지 않는다. 기준/샤드 명령 시간, 두 샤드의 최댓값과 합계를 함께 기록하며 설치·image·queue를 포함한 end-to-end CI 개선으로 단정하지 않는다.
- artifact 이름과 다운로드 pattern은 `run_attempt`로 구분한다. 재실행은 전체 workflow를 사용한다. 실패 job만 재실행해 이전 시도의 성공 자료와 섞으면 집계가 누락으로 실패해야 정상이다.

실험은 PR을 통한 별도 검토이며 자동 채택·main 병합은 하지 않는다. 공개 JSON 다운로드 후에도 동일 스키마와 coverage 검사를 다시 수행하고, 원격 실행 결과와 문서 검수 해시를 구분해 기록한다.

- 전체 목록과 샤드 목록의 ID 합집합이 일치하고 중복·누락이 없다. 언어·테마·화면·직접 URL/Link 계약은 기존 테스트가 그대로 검사한다.
- 실행 비교는 성공 여부뿐 아니라 모든 ID의 최종 상태와 expectedStatus, 기존 skip을 대조한다. 실패·재시도·누락·중복·새 skip·전역 오류는 속도 비교 대상에서 거부한다. 이는 benchmark 채택 조건이며 기존 CI retry 설정을 변경하지 않는다.
- 고정 단계명만 별도 기록한다. URL·검색어·step 제목·오류 본문·응답·첨부·stdout은 timing JSON에 복사하지 않는다. 원시 콘솔은 별도 비공개 파일로 유지한다.
- cold/warm, 실행 순서, 다른 프로세스 부하를 기록한다. 성능 채택 전 동일 조건 최소 3회와 전체 CI 임계 경로·비용·flake를 확인한다. 로컬의 단일 샘플만으로 CI worker 기본값을 변경하지 않는다.
- worker 조건은 순서도 교차해 반복한다. 예를 들어 1→2→4, 4→2→1 순서를 사용하고 조건마다 새 출력 디렉터리를 준다. 모든 1-worker 검사를 먼저 끝내고 마지막 4-worker만 warm 상태로 실행한 결과를 순수 worker 효과로 해석하지 않는다.

## 실패 대응과 복구

도구는 첫 실패에서 중단하고 샘플과 로그를 보존한다. 실패 샘플을 지우고 성공한 결과만 뽑지 않는다. sandbox의 포트·브라우저 실행 제한은 제품 결함과 구분하고 승인 후 **새 디렉터리**에서 같은 검사를 다시 실행한다. 검사 기준이나 보안 설정을 완화하지 않는다.

사용한 포트에 다른 서버가 있거나 소스가 바뀌면 비교를 중단한다. 기존 서버·작업 트리·stash는 유지하고, 새 조건으로 샘플을 분리한다. `.next` 삭제를 워밍 상태 초기화의 자동 수단으로 사용하지 않는다. 실험 프로세스 종료는 해당 도구가 시작한 프로세스 그룹에 한정한다.

아직 기본 CI·worker 수·공통 캐시를 바꾸지 않으므로 운영 롤백은 해당 없음이다. 도구를 사용하지 않으면 기존 Playwright 실행 경로가 유지된다.

## 관련 검증

- [비용 조사와 로컬 후속 결과](../verification/performance/2026-11-15-desktop-e2e-duration.md)
- [작업 기록](../worklog/2026-11/2026-11-15-desktop-e2e-duration.md)
- [Playwright Reporter](https://playwright.dev/docs/api/class-reporter)
- [Playwright 샤딩](https://playwright.dev/docs/test-sharding)
