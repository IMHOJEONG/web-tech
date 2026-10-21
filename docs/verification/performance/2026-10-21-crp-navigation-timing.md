# PR #51 CRP 이미지 발견 시점 검사 조사

## 대상과 조건

- 검증일: 2026-10-21 KST. 추적: [KAN-21](https://web-tech-service.atlassian.net/browse/KAN-21), [PR #51](https://github.com/IMHOJEONG/web-tech/pull/51).
- 원격 실패: head `8a0b30dde9f830fadd6158ac5419a185bc942bb9`, [CI 39548774939](https://github.com/IMHOJEONG/web-tech/actions/runs/39548774939), [CRP job](https://github.com/IMHOJEONG/web-tech/actions/runs/39548774939/job/119052919931).
- 원격 환경: Ubuntu 24.04, Node.js 24.21.0, Chromium 151.0.7922.34. 로컬은 macOS arm64, Node.js 24.12.0, pnpm 11.10.0, 같은 Chromium이다. Playwright 버전과 수정 소스 SHA-256은 [정제 증거](../artifacts/2026-10-21-crp-navigation-timing.json)에 기록했다.
- 로컬 수정은 규칙 커밋 `344fd09` 위 작업 트리에서 검증했다. 보안 패치·의존성·기존 3001 개발 서버·보존 snapshot은 변경하지 않았다. main 및 원격 PR에 수정본을 적용한 결과는 아니다.

## 재현 방법

저장소 루트에서 실행한다. Node.js 24와 설치된 Playwright Chromium이 필요하다. 별도 Next 개발 서버나 운영 토큰은 사용하지 않으며 실험 서버는 loopback 임의 포트에서 시작·종료한다.

```sh
gh api repos/IMHOJEONG/web-tech/actions/jobs/119052919931/logs
gh api repos/IMHOJEONG/web-tech/actions/runs/39548774939/artifacts
mise exec -- pnpm test:crp-lab
mise exec -- pnpm test:crp-lab:browser
CI=1 PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/web-tech-crp-51-repeat-20261021.json mise exec -- pnpm --filter docs exec playwright test --config=playwright.crp.config.ts --repeat-each=20 --reporter=json
mise exec -- pnpm --filter docs exec tsc -p tsconfig.crp-e2e.json
mise exec -- pnpm --filter docs exec eslint crp-e2e/critical-rendering-path.spec.ts --max-warnings 0
mise exec -- pnpm test:repo
```

기준 페이지 HTML 응답에만 500ms를 추가하는 `page.route` 대조군을 유지했다. 실험 페이지의 지연은 240ms 그대로다. 각 반복의 `late-lcp-timing` 첨부에 기준 이미지·실험 스크립트·예약/발견 mark·기존 차이를 기록한다. JSON reporter의 첨부는 base64 body로 저장된다. 지연 제거 대조군은 테스트 안에서 응답의 타이머 인자만 0으로 바꾸며 실제 파일은 바꾸지 않는다.

## 결과와 증거

### 기존 실패와 판정 결함

원격 CRP 3개 중 2개가 통과하고 `late LCP discovery`만 실패했다. 기대값은 `> 120ms`, 관측값은 `105.5ms`였다. 최종 `Test`의 실패는 이 브라우저 job 결과를 집계한 것이며 별도 기능 실패가 아니다. 해당 CI의 원격 artifact 수는 0이었다. 로그에는 두 페이지 각각의 `startTime`이나 당시 실행 trace가 남지 않았다.

기존 판정은 다음 두 값을 뺐다.

```text
late 페이지 navigation 시작부터 이미지 요청까지
- baseline 페이지 navigation 시작부터 이미지 요청까지
> 240 / 2
```

두 값은 각각의 문서 시간 원점을 기준으로 한 경과 시간이다. 페이지 로드 성능을 비교하는 값으로는 쓸 수 있지만, 이 차이가 실험 타이머의 대기 시간인 것은 아니다. 실험 페이지의 초기 처리 비용과 대기 시간이 더해지고, 기준 페이지의 초기 비용은 빠진다. 기준 페이지가 느리면 타이머가 정상이더라도 차이가 120ms보다 작거나 음수가 될 수 있다. `timeOrigin`을 더해 절대 시간으로 바꾸는 것도 해결이 아니다. 순차적으로 실행한 두 navigation 사이의 벽시계 간격까지 섞이기 때문이다.

초기 계측 대조군은 다음과 같았다. 실험의 타이머나 이미지 삽입 코드를 바꾸지 않고, 테스트에서 두 mark만 계측했다.

| 기준 HTML 응답 추가 지연 | 기존 차이 | 실제 예약 → 발견 대기 | 기존 판정 |
| ------------------------ | --------- | --------------------- | --------- |
| 0ms                      | 226.10ms  | 241.20ms              | 통과      |
| 500ms                    | -259.90ms | 240.90ms              | 실패      |
| 500ms                    | -257.40ms | 241.50ms              | 실패      |

따라서 확인된 원인은 **의도한 지연이 정상인 경우도 실패시키는 navigation 간 타이밍 비교 계약**이다. 원격 실패 시점에 기준 문서의 어떤 처리 비용이 커졌는지까지 확인된 것은 아니다. Node type stripping의 cold cost, CPU 경합, 네트워크 또는 Chromium 초기화를 당시 원인으로 단정하지 않는다. 보안 의존성 패치 전후 해당 테스트·실험 서버·설정·브라우저 asset의 diff는 없었다. 이것만으로 모든 간접 영향이 배제되는 것도 아니다.

### 수정과 대조군

- 실험 asset에 `late-lcp-scheduled`, `late-lcp-discovered` mark를 추가했다. 기존 타이머·지연값·이미지 삽입은 유지했다.
- 같은 문서 안에서 `스크립트 응답 완료 ≤ 예약`, `발견 - 예약 ≥ 239ms`, `발견 ≤ 이미지 요청`을 검증한다. 1ms는 Chromium timestamp 정밀도·타이머 반올림을 위한 허용 오차이며 기존 120ms 기준을 더 낮춘 조치가 아니다. 실제 지연 검사에는 상한을 두지 않는다.
- 기준 페이지는 HTML 이미지와 placeholder 부재를 검사한다. 추가 응답 지연 0ms·500ms 각각에서도 실험의 순서와 대기를 검사한다.
- 응답에서 타이머 지연만 제거한 변형은 실제 간격이 239ms보다 짧음을 먼저 확인하고, 같은 정상 판정 함수가 거부하는지 검사한다. 다른 순서 assertion의 실패로 음성 대조군이 통과하지 않도록 나머지 관계도 확인한다.
- CSS/FCP 및 parser-blocking script/DOMContentLoaded의 기존 검사 두 개는 유지했다. 재시도·skip·CI 예산 증가는 추가하지 않았다.

| 검사                     | 관측 결과                                               |
| ------------------------ | ------------------------------------------------------- |
| 1차 브라우저             | 5개 통과                                                |
| 최종 브라우저 5개 × 20회 | 100개 통과, 실패·재시도·skip·flaky 0, 55.7초            |
| 기준 지연 500ms 반복     | 20개 모두 새 판정 통과, 기존 차이 판정은 20개 모두 실패 |
| 실제 정상 대기 40개      | 240.70~242.20ms                                         |
| 지연 제거 대조군         | 20개 모두 같은 정상 판정 함수가 거부                    |
| CRP 타입·서버            | 타입 검사 및 서버 6개 통과                              |
| 최종 E2E 타입·파일 lint  | 통과                                                    |
| 저장소 공통 회귀         | 63개 통과                                               |

정제 artifact에는 실제 반복 결과, 원격 실패 식별자, 소스 해시, JSON reporter 원본의 해시를 저장했다. 인증 헤더·환경 파일·페이지 본문·사용자 계정 정보는 포함하지 않았다. 증거 생성의 첫 inline Node 명령은 셸 인용으로 실패했으며, 별도 임시 생성기로 다시 실행했다. assertion 실패나 성공 결과를 수정한 것은 아니다. 최초 원격 로그 조회에 JSON 전용 옵션을 붙인 명령도 실패했으며 원문 로그로 다시 조회했다.

## 한계와 후속 작업

- 확인한 것은 잘못된 비교 계약과 재현 가능한 오판이다. 원격 당시 개별 타이밍·trace가 없으므로 105.5ms가 된 정확한 호스트 비용 분해는 불가능하다.
- 로컬 Chromium 반복 성공은 수정본의 Linux CI 성공을 대신하지 않는다. 푸시 후 같은 head의 CRP와 최종 `Test`를 확인해야 한다. 현재 결과는 로컬 수정본 기준이며 원격 실패 기록은 보존한다.
- 현재 CI는 Playwright 결과를 원격 artifact로 업로드하지 않는다. 첨부를 만들었다고 원격 보관이 된 것으로 표시하지 않는다. artifact 업로드·보관 정책은 이번 수정 범위에 추가하지 않았다.
- hero 요청 순서 검사이지 실제 사용자 LCP 점수나 성능 향상 보장이 아니다. CPU에 부하를 주는 실험이나 운영 배포는 하지 않았다.

## 관련 문서

- [실험 사용·검증 절차](../../examples/critical-rendering-path-lab/README.md)
- [작업 기록](../../worklog/2026-10/2026-10-21-crp-navigation-timing.md)
- [기존 보안 패치 검증](../security/2026-10-21-vite-content-advisories.md)
- [W3C High Resolution Time](https://www.w3.org/TR/hr-time-3/): 문서별 시간 원점과 상대 타임스탬프. Working Draft 상태를 포함해 확인했다.
- [WHATWG timers](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers): 예약 시간과 실제 실행 시점은 같다는 보장이 없다.
- [Playwright Route](https://playwright.dev/docs/api/class-route): 응답 지연·내용 변형 대조군의 fetch/fulfill API.
