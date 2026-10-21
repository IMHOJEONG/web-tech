# KAN-22 이미지 대체 후 상세 이동 실패 조사

## 대상과 조건

- 검증일: 2026-10-21, 19:14~19:23 KST. 원격 실패 조회와 로컬 검사를 구분한다.
- 기준: main `5b0faa24e3f28c6018f1219d0d64357f63f51559`, 새 브랜치 `codex/docs-kan22-offline-navigation`의 미커밋 변경.
- 로컬: macOS arm64, Node.js 24.12.0, pnpm 11.10.0, Next.js 16.3.8, Playwright 1.62.1, TypeScript 6.0.3, Chromium 151.0.7922.34.
- 별도 detached 작업 트리에서 의존성을 설치했다. 실제 `.env`와 기존 `.next`를 복사하지 않았고, 원격 목록·푸시는 기존 오프라인 suite 설정대로 비활성화했다. 사용자 개발 서버를 재사용하거나 종료하지 않았다.
- 두 화면은 Chromium 1280×800 및 390×844 에뮬레이션이며 실기기 검사가 아니다.

이 보고서와 artifact의 미커밋·미푸시·원격 미검증 표기는 최초 로컬 검사 시점의 상태다. 이후 승인된 커밋·푸시와 PR 검증 단계는 [작업 기록](../../worklog/2026-10/2026-10-21-kan22-offline-navigation.md) 및 연결된 Jira·Confluence에서 구분해 추적한다.

## 재현 방법

저장소 루트에서 실행한다. 기존 dev/build와 `.next`를 공유하지 않는 별도 작업 트리를 권장한다. 프로젝트 버전은 `mise exec --`로 고정한다.

```bash
mise exec -- pnpm install --offline --frozen-lockfile --ignore-scripts

env PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/kan22-offline-full.json \
  mise exec -- pnpm --filter docs exec playwright test \
  --config=playwright.offline.config.ts --reporter=json

env PLAYWRIGHT_JSON_OUTPUT_FILE=/tmp/kan22-navigation-repeat.json \
  mise exec -- pnpm --filter docs exec playwright test \
  --config=playwright.offline.config.ts \
  article-navigation.spec.ts image-fallback.spec.ts \
  --grep 'healthy delayed|HTTP failure|an image failure' \
  --repeat-each=3 --reporter=json

mise exec -- pnpm --filter docs exec tsc --noEmit --incremental false
mise exec -- pnpm --filter docs exec eslint \
  offline-e2e/article-navigation.ts \
  offline-e2e/article-navigation.spec.ts \
  offline-e2e/image-fallback.spec.ts
mise exec -- pnpm test:repo
```

`--offline` 의존성 설치는 pnpm store가 준비된 이번 로컬 환경의 명령이다. store가 비어 있으면 승인된 네트워크 환경에서 `pnpm install --frozen-lockfile`로 준비한다. 테스트 서버는 suite가 기동·종료하며 별도로 `next dev`를 띄우지 않는다. 전체·반복 실행은 같은 작업 트리에서 순차 실행했다.

기존 CI 증거는 아래 명령으로 조회했다. 로그·artifact가 존재하는 범위만 판단에 사용한다.

```bash
gh run view 39580315781 --repo IMHOJEONG/web-tech \
  --json headSha,status,conclusion,jobs
gh run view 39580315781 --repo IMHOJEONG/web-tech \
  --job 119156014820 --log
gh api repos/IMHOJEONG/web-tech/actions/runs/39580315781/artifacts
```

## 결과와 증거

### 원격에서 확정한 실패 지점

[main CI](https://github.com/IMHOJEONG/web-tech/actions/runs/39580315781)의 [오프라인 job](https://github.com/IMHOJEONG/web-tech/actions/runs/39580315781/job/119156014820)은 17개 통과·1개 실패였다. desktop의 이미지 대체 검증은 먼저 통과했고, 카드 클릭 다음 `toHaveURL`의 기본 5000ms 검사가 실패했다.

```text
Expected pattern: /\/ko\/docs\/category\/fe\/react\/nextjs$/
Received string:  "http://127.0.0.1:3018/ko/web"
Timeout: 5000ms
13 × locator resolved to <html lang="ko" class="size-full nprogress-busy">…</html>
30 | await card.click()
31 | await expect(page).toHaveURL(new RegExp(href! + '$'))
1 failed
17 passed (1.3m)
```

이는 이미지 표시 실패가 아니라 **클릭 뒤 URL 전환이 5초 안에 확인되지 않은 실패**다. 같은 모바일 검사는 통과했다. 브라우저 설치 중 DNS 오류 뒤에도 실제 18개 검사가 실행됐으므로 그 다운로드 경고를 이 assertion의 직접 원인으로 단정하지 않는다. 원격 artifact는 0개여서 당시 요청·응답·compile trace는 없다.

### 로컬 main의 첫 방문과 재방문

수정 전 main을 깨끗한 작업 트리에서 실행해 동일 이미지 실패·대체·카드 클릭을 한 브라우저에서 두 번 관측했다. 임시 진단으로 얻은 한 쌍의 표본이며, 원래 5초 assertion은 로컬에서 두 번 모두 통과했다.

| 단계: 클릭 기준 | 첫 상세 방문 |   재방문 |
| --------------- | -----------: | -------: |
| RSC 요청        |      90.42ms |  24.26ms |
| HTTP 200 응답   |    1789.40ms |  52.85ms |
| URL 확인        |    1906.62ms | 217.90ms |
| 본문 확인       |    1911.68ms | 221.01ms |

첫 상세의 dev 로그는 `200 in 1753ms (next.js: 1630ms, proxy: 5ms, application-code: 119ms)`였다. 로컬에서는 첫 개발 처리 비용이 컸다는 근거지만, **원격 CI 당시 정확히 이 비용 때문에 5초를 넘겼다는 증거는 아니다.**

### 통제된 응답 지연과 실제 장애 대조

`article-navigation.spec.ts`는 실제 서버의 정상 RSC 응답을 `route.fetch()`로 받은 뒤 전달만 보류한다. 보류 중 기존 `toHaveURL`이 5초 안에 실패하는 것을 확인하고, 응답을 풀면 동일 카드의 실제 클라이언트 이동과 본문 검사를 완료한다. 목적은 **정상 서버 응답 대기만으로 기존 판정을 실패시킬 수 있음**을 재현하는 것이다. 당시 CI 환경을 완전히 복원한 실험은 아니다.

새 헬퍼는 클릭과 동시에 `waitForURL(..., { waitUntil: 'commit' })`을 등록한다. 서버 응답 대기는 기존 60초 test deadline 안에서 기다리고, URL 확정 뒤 URL·본문 검사는 기존 기본 5초를 유지한다. 전체 timeout·expect timeout·재시도 수를 늘리지 않았지만, **서버 대기를 포함한 이동에 허용되는 시간은 종전 5초보다 길어지는 변경**이다. 이를 앱 속도 개선이나 5초 성능 보장으로 표현하지 않는다.

헬퍼는 destination의 요청 종류·RSC/prefetch 여부·응답 상태·URL/본문 확인 시점을 첨부한다. HTTP 오류를 거부하고, document navigation이 없으며 같은 `window` 식별자가 유지되는지도 확인해 전체 reload로 우회한 성공을 막는다. 이미 캐시된 이동도 가능하므로 반드시 새 RSC 요청이 있어야 한다고 요구하지 않는다. 인증 헤더·query·응답 본문은 첨부하지 않는다.

음성 대조군은 같은 상세의 RSC와 document 요청 모두에 503을 반환한다. Next가 document navigation으로 대체한 경우도 관측했고, 헬퍼는 `HTTP error`로 거부했다. URL만 바뀌었다고 성공 처리하지 않는다.

| 검사                               | 결과      | 범위                                                 |
| ---------------------------------- | --------- | ---------------------------------------------------- |
| 초기 지연·503 대조군               | 2개 통과  | desktop, 20.4초                                      |
| 전체 오프라인                      | 22개 통과 | 기존 18개 + 대조군 2종 × 두 화면, 39.9초             |
| 주요 세 시나리오 반복              | 18개 통과 | 지연·503·이미지 대체 후 클릭 × 두 화면 × 3회, 54.7초 |
| 저장소 계약                        | 63개 통과 | 최종 Test 집계 스크립트 64조합 포함                  |
| docs TypeScript·변경 테스트 ESLint | 통과      | 타입 오류·lint 경고 없음                             |

전체·반복 실행에서 retry·skip·flaky는 모두 0이었다. 반복 지연 대조군 6회에서 기존 URL 검사는 모두 거부됐고, 새 헬퍼의 URL 확정은 5166.23~5817.18ms였다. 반복 HTTP 오류 대조군 6회는 모두 거부됐다. 측정값·source hash·report hash는 [선별 증거](../artifacts/2026-10-21-kan22-offline-navigation.json)에 보관한다.

### CI 집계 누락

원래 최종 `Test`는 `unit-contract-tests`, `docs-browser`만 기다렸다. 그래서 오프라인 job이 실패했어도 `Test` 자체는 성공했다. workflow 전체는 실패이므로 이를 전체 CI 성공으로 해석하면 안 된다.

이번에는 `offline-reading`을 `needs`와 상태 검사에 포함했다. 세 결과의 `success/failure/cancelled/skipped` 64조합을 실제 shell로 실행해 전부 `success`인 한 조합만 통과함을 확인했다. GitHub branch protection 자체의 설정이나 다른 독립 job의 필수 여부는 변경하지 않았다.

## 한계와 후속 작업

- 원래 CI 실패는 여전히 미확정된 서버 지연 원인을 포함한다. cold compile, runner 경합, 네트워크 등 하나로 단정하지 않는다.
- 앱 UI·렌더러·원격 요청 정책·의존성은 변경하지 않았다. 사이트의 성능 문제가 해결됐다는 의미가 아니다. production build·Linux CI·배포·실기기는 이번에 실행하지 않았다.
- 테스트 첨부는 reporter에서 읽을 수 있다. 현재 CI에는 이를 GitHub artifact로 업로드하는 단계가 없으므로 향후 원격 실패의 trace 보관은 별도 후속 과제다. 민감정보 수집 범위를 먼저 검토한다.
- 기존 60초 test deadline이 서버 대기를 제한한다. 별도 성능 SLA가 필요하면 기능 검사와 독립된 production 측정으로 정의한다. 전체 deadline까지 기다려도 URL이 바뀌지 않거나 본문이 없으면 여전히 실패한다.
- 현재 브랜치 변경은 미커밋·미푸시다. 사용자 요청 후 커밋·PR을 만들고 같은 SHA의 오프라인 job 및 최종 `Test`를 확인해야 한다. KAN-22는 원격 검증 전 완료로 닫지 않는다.
- 기존 stash·TCP 작업은 복원·삭제·커밋하지 않았다. 검증 전용 작업 트리는 결과 확보 후 제거했고 다른 작업 트리는 건드리지 않았다.

## 관련 문서

- [KAN-22](https://web-tech-service.atlassian.net/browse/KAN-22)
- [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)
- [기존 오프라인 검증](2026-10-17-content-network-offline.md)
- [오프라인 실행·복구 절차](../../runbooks/docs-offline-reading.md)
- [이전 이동 검사 역할 분리](../cache/2026-10-18-stream-termination-investigation.md#검사-역할-분리와-의도-보존)
- [작업 기록](../../worklog/2026-10/2026-10-21-kan22-offline-navigation.md)
