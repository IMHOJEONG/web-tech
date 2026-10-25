# Next.js Critical 2건 패치와 로컬·PR 회귀 검증

## 대상과 조건

- 확인일: 2026-10-25 KST. artifact의 `checkedAt`은 UTC다.
- 기준: 최신 `origin/main`의 `d0b25a5122fd9b4377b559270c10680c984e2aed`. 별도 `codex/security-next-critical-20261025` 브랜치에서 초기 미커밋 변경을 검사하고, 후속 승인으로 패치·회귀·문서를 작업별 커밋으로 분리했다. 기존 Vite+ 작업 폴더의 미커밋 문서는 보존했다.
- 추적: [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35). Next Critical 우선 조치·회귀·문서에 이어 commit/push/main 대상 PR 생성까지 승인받았다. 자동 Preview만 별도로 허용받았으며 main 병합·운영·수동 배포는 승인 범위가 아니다.
- 환경: macOS arm64, mise Node 24.12.0·pnpm 12.14.0, 로컬 Chromium·loopback 합성 콘텐츠 서버. 기존 비밀정보나 NAS·Railway·운영 API를 사용하지 않았다.

## 패치와 영향 범위

| 경고                                                                              | 공식 조건과 패치                                                                           | 이번 조치                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) Critical | glibc Linux의 이미지 처리 라이브러리 RCE. Next 16.4.1부터 패치, sharp >=0.35.5가 완화 조건 | 기존 sharp 0.35.5 override를 유지하고 Next 자체를 올림. 악성 SVG는 실행하지 않음        |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) Critical | Cache Components와 여러 typed array를 반환하는 `use cache` 함수. Next 16.4.1부터 패치      | Next에 번들된 React 전송 코드 수정이 포함된 버전 사용. 외부 react/react-dom 버전은 유지 |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) High     | App Router Server Actions DoS, 동일 릴리스 패치                                            | 같은 Next 업데이트로 함께 해소. 다른 패키지의 별도 패치는 아님                          |

공식 [16.4.1 릴리스](https://github.com/vercel/next.js/releases/tag/v16.4.1)와 [16.4.3 릴리스](https://github.com/vercel/next.js/releases/tag/v16.4.3), registry의 실제 버전·Node 요구사항을 확인했다. catalog의 최소 안전 범위는 `^16.4.1`로 올렸고 lockfile은 같은 안정 패치 계열의 **next·@next/mdx 16.4.3**을 선택했다. Node >=20.9.0 조건은 기존 Node 24.12.0과 호환된다.

`apps/docs/next.config.mjs`에는 Cache Components 활성화나 `dangerouslyAllowSVG` 설정이 없었다. `use cache`는 검사 fixture에서 확인했다. 일부 앱 코드에 typed array 사용이 있다는 사실만으로 취약 함수가 있다고 판단하지 않았다. 현재 사용 조건을 조사한 것이며 완전한 도달 불가능성을 증명한 것은 아니다.

## 재현 방법

저장소 루트에서 실행한다. 필수 공용 패키지 빌드를 먼저 수행한다. 설치의 서명·무결성·공급망 검증을 끄지 않는다.

```sh
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- node --experimental-strip-types --test scripts/security-next-critical.test.mts
mise exec -- pnpm test:repo
mise exec -- pnpm exec tsc --noEmit --types node --module nodenext \
  --moduleResolution nodenext --target es2022 --skipLibCheck \
  --erasableSyntaxOnly scripts/security-next-critical.test.mts
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs lint
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm peers check
mise exec -- pnpm validate:catalog
mise exec -- pnpm --filter docs test:cache:prod --function-cache-only
mise exec -- pnpm --filter docs test:article:prod
mise exec -- pnpm audit --json
mise exec -- pnpm audit --prod --json
```

`pnpm audit`는 남은 경고 때문에 종료 1이다. Critical 제거와 전체 보안 정상은 구분한다. 전체/production 감사 결과, 잔여 ID·버전과 고정 baseline의 그래프 비교는 [audit 증거](../artifacts/2026-10-25-next-critical-audit.json)에 보관했다. 기존 `verification-baseline.mts`의 명시 SHA 조회와 `compareGraphs`를 사용해 다른 importer와 패키지 metadata가 불변임을 검사했다.

## 결과와 증거

| 검사                          | 실제 결과                                                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 수정 전 audit                 | 13건: Critical 2·High 7·Moderate 2·Low 2. main과 같은 lockfile에서 재확인                                                                                                                       |
| 수정 후 전체/production audit | 각각 10건: **Critical 0·High 6·Moderate 2·Low 2**, Next 경고 3건 제거                                                                                                                           |
| 나머지 경고 보존              | toml 3·zod 1·body-parser 1·multer 1·fast-uri 4건의 advisory ID·버전 유지. KAN-35 전체 완료로 표시하지 않음                                                                                      |
| lockfile 영향                 | 추가/제거는 next·@next/mdx·@next/env·플랫폼별 SWC 11개씩. 다른 importer/동일 패키지 metadata 불변. docs 외 workspace 그래프 추가/제거/edge 변경 0                                               |
| 신규 보안 회귀                | 6개 통과. 영향 버전·prerelease 거부, 설치된 Next/MDX 일치, catalog와 모든 실제 lockfile Next의 안전 하한, sharp 정상 SVG 변환, webpack/turbopack 번들의 development/production typed-array 왕복 |
| 저장소 전체                   | 137개 통과. 기존 `test:repo` glob으로 신규 보안 테스트도 자동 실행                                                                                                                              |
| docs 단위·타입                | `test:lib` 285개·신규 검사 타입·docs typecheck 통과                                                                                                                                             |
| lint·의존성                   | docs lint·peer 검사·catalog 11개 manifest 검사 통과, 최종 frozen/offline 설치도 성공                                                                                                            |
| 실제 함수 캐시                | `--function-cache-only` 성공. 두 typed array 반환의 cold/warm 보존, 미인증 무효화 거부·인증 무효화·expire:0 대기·max stale/background 갱신·문서 V3 표시                                         |
| production 전체 E2E           | 최초 144 통과/10 실패, 검사 호환 보완 후 **154개 전부 통과**. 모바일/데스크톱·ko/en·로컬/원격 fixture·Link/직접 URL·OG·게시/검색·503/종료 원인 대조 포함                                        |

### 테스트 호환 보완과 실패 보존

- 초기 신규 검사에서 sharp의 비공개 `package.json` export를 직접 읽거나 pnpm 12 다중 YAML 문서를 단일 파서로 읽은 오류가 있었다. sharp의 공개 version metadata와 `parseAllDocuments`로 검사기 가정을 수정했다. 영향 버전 `16.3.8`의 안전 하한 검사는 예상대로 실패했으며 정상 기능 왕복은 이전 버전에서도 통과할 수 있다.
- 캐시 실험 최초 실행은 선행 공용 UI 빌드가 없어 실패했다. 빌드 후에는 최소 fixture의 root `locale` 값 누락을 확인했다. 설치된 Next의 `next/root-params` 문서에 따라 fixture에 en/ko `generateStaticParams`를 추가하고 기존 캐시 실험 동작을 유지하도록 fixture 전용 `partialPrefetching: false`를 명시했다. 운영 config는 수정하지 않았다.
- production E2E의 최초 10건은 응답이 닫혔어도 특정 `framework-stream-error` 로그가 반드시 나올 때까지 기다리던 검사였다. [초기 실패·원인 trace 요약](../artifacts/2026-10-25-next-e2e-before-compatibility.json)에 실패 사례와 실제 소켓/응답 종료 순서를 보존했다.
- 새 검사는 실제 `response-close`/`responseClosed`를 종료 증거로 기다린다. 직접 URL 중단의 `responseFinished: false`, `closeBeforeFinish: true`, `outcome: unknown`과 클라이언트/서버 중단의 원인 순서를 유지한다. stream 오류가 관측되면 close 이후인지 계속 검사한다. 정상 Link 이동의 완료·오류 없음, 503 대조군의 선행 오류 검사도 유지했다. 로그를 필터링하거나 계측기 판정·앱 코드·timeout을 바꾸지 않았다. [ADR-0008](../../architecture/adr-0008-request-lifecycle-observability.md)의 문구보다 증거 중심 원칙을 따른다.
- 패키지 설치 중 기존 `simple-git-hooks` prepare가 worktree의 `.git` 파일을 디렉터리로 가정해 `ENOTDIR` 경고를 냈다. 설치 종료는 0이며 기존 Git hook 경로·검사 정책은 변경하지 않았다. 후속 커밋에서는 공통 Git 디렉터리의 기존 pre-commit·commit-msg 훅이 실행되어 포맷·문서·commitlint 검사를 통과했다. 훅 우회나 재설치는 하지 않았다.

### 후속 커밋 분리

| 작업           | 커밋                       | 포함 범위                                               |
| -------------- | -------------------------- | ------------------------------------------------------- |
| 패키지 패치    | `54b6966`                  | docs Next·MDX catalog와 root lockfile 2개               |
| 보안·캐시 회귀 | `2a2886b`                  | 신규 6개 보안 검사와 테스트 전용 cache fixture 5개 파일 |
| 종료 관측 호환 | `fd83380`                  | 기존 취소/장애 판정을 유지하는 E2E 3개 파일             |
| 검증 기록      | 이 보고서와 별도 문서 커밋 | 초기 실패·audit 증거, TODO와 역할별 목차                |

같은 코드 내용의 저장소 137개 검사를 커밋 분리 중에도 재실행해 통과했다. 원격 PR·CI 결과는 Jira·Confluence의 같은 작업 기록에 실제 SHA/run으로 연결하며, 로컬 성공을 원격 검증으로 간주하지 않는다.

### PR #60 원격 검사와 리뷰 확인

2026-10-25 11:20 KST 이후 [PR #60](https://github.com/IMHOJEONG/web-tech/pull/60)의 head `c906573284072efcb8aee8bada6b25be4c9c1058`를 기준으로 조회했다. base는 여전히 `d0b25a5122fd9b4377b559270c10680c984e2aed`이며 PR은 OPEN·미병합이다. 이번 독립 검증은 아래 명령으로 수행했다. `gh run watch`는 상태 조회이며 재실행 요청이 아니다.

```sh
gh run watch 40153711040 --repo IMHOJEONG/web-tech --interval 30 --exit-status
gh run view 40153711040 --repo IMHOJEONG/web-tech --json status,conclusion,headSha,jobs
gh run view 40153709339 --repo IMHOJEONG/web-tech --json status,conclusion,headSha,jobs
gh api 'repos/IMHOJEONG/web-tech/code-scanning/alerts?ref=refs/pull/60/merge&state=open&per_page=100' --paginate
gh api 'repos/IMHOJEONG/web-tech/pulls/60/reviews?per_page=100'
gh api 'repos/IMHOJEONG/web-tech/issues/60/comments?per_page=100'
gh api graphql -f query='query {repository(owner:"IMHOJEONG",name:"web-tech"){pullRequest(number:60){reviewThreads(first:100){pageInfo{hasNextPage} nodes{isResolved path line comments(first:20){nodes{body url}}}}}}}'
gh run view 40153711040 --repo IMHOJEONG/web-tech --job 121050424312 --log
gh run view 40153711040 --repo IMHOJEONG/web-tech --job 121050424282 --log
mise exec -- node --experimental-strip-types --test scripts/security-next-critical.test.mts
```

| 검사                | 결과와 근거                                                                                                                                                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI                  | [run 40153711040](https://github.com/IMHOJEONG/web-tech/actions/runs/40153711040) SUCCESS, 13개 job 모두 성공. 최종 완료 2026-10-25T02:20:45Z. 커밋 메시지·lint·타입·UI 2종·오프라인·단위/계약·브라우저 5종·최종 Test 포함                                                                          |
| Linux 실행 증거     | 단위 job에서 저장소 137개·docs lib 285개 성공과 신규 Next 보안 검사 실행을 확인. production job의 `154 passed (2.7m)` 확인. 해당 job 로그에서 `destination stream closed` 오류는 관측되지 않음                                                                                                      |
| CodeQL              | [run 40153709339](https://github.com/IMHOJEONG/web-tech/actions/runs/40153709339) 동일 head에서 actions·javascript-typescript 모두 SUCCESS. PR merge ref 열린 code-scanning 경고 0건. 의존성 audit 잔여 10건과 다른 검사임                                                                          |
| CodeRabbit          | [완료 댓글](https://github.com/IMHOJEONG/web-tech/pull/60#issuecomment-6392347256)에 actionable comment 없음. inline review thread 0개·정식 review API 0개, status SUCCESS. 사람의 APPROVED 리뷰가 있다는 뜻은 아님                                                                                 |
| 봇의 비차단 경고    | 변경 함수 10개/8파일 대상 Docstring Coverage 20%가 기본 권장 80%보다 낮다는 경고 1건. 함수별 결함 지적이나 보안 실패가 아니며 CI는 통과. 저장소 정책·워크플로에서 이 비율을 강제하는 규칙은 찾지 못함. 임계값만 맞추는 일괄 주석 생성은 실행하지 않음                                               |
| 리뷰 범위           | 봇은 17개 파일을 선택하고 `pnpm-lock.yaml`은 기본 필터로 제외. 따라서 봇 성공만으로 lockfile을 검증했다고 하지 않음. 앞선 graph/audit 비교, 설치·peer 검사와 이번 Linux 회귀 결과를 별도 근거로 사용                                                                                                |
| 문서·이미지·Preview | Documentation·GitGuardian·Vercel web-tech/vuln-radar Preview 모두 SUCCESS. [docs-backend image PR run](https://github.com/IMHOJEONG/web-tech/actions/runs/40153711038) 성공은 linux/amd64 build-only다. workflow의 `push: github.event_name != 'pull_request'` 조건상 이미지 게시나 NAS 교체가 아님 |
| 재확인과 경계       | 신규 보안 검사 6개 로컬 재통과. 코드·설정·리뷰 상태 수정, workflow 재실행, commit/push, main 병합·Railway/운영/수동 배포는 하지 않음. 이번 후속 기록은 로컬 문서 변경이며 기존 PR head에 포함되지 않음                                                                                              |

변경된 E2E와 보안 검사를 대조한 범위에서 추가로 재현된 결함은 없다. 봇의 주석 비율 경고는 선택적 문서 품질 제안으로 남기고, 별도 수정·해결 처리는 하지 않았다. 기존 취소/장애 판정과 실제 `response-close` 원인 순서 검사는 유지된다. 신규 검사는 안전 버전 하한과 정상 동작 회귀이며 공격 차단의 직접 증명은 아니다.

후속 사용자 승인으로 이 보고서와 worklog 2개만 별도 문서 커밋·푸시 대상으로 삼았다. 위 결과는 검증 당시 head `c906573`의 증거이며, 문서 커밋 후 자동 실행되는 새 CI·리뷰 결과로 간주하지 않는다. 나머지 보안 경고 10건과 main 병합·운영 배포 보류는 유지한다.

### 문서 커밋 35a9fcd의 새 head 재검증

2026-10-25 KST에 새 head `35a9fcda83b2bfc3a8db01ad1426b85d63091323`를 별도로 확인했다. 이전 head와의 차이는 이 보고서·worklog 2개뿐이다. 위 재현 명령에서 CI run은 `40155360368`, CodeQL run은 `40155358267`로 바꾸어 조회했다. production E2E 로그의 job은 `121055502277`, 단위 검사 로그의 job은 `121055502263`이다.

| 검사           | 새 head에서 관측한 결과                                                                                                                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI             | [run 40155360368](https://github.com/IMHOJEONG/web-tech/actions/runs/40155360368) SUCCESS, 13개 job 모두 성공. 최종 완료 2026-10-25T02:45:25Z. production E2E `154 passed (2.2m)`, 저장소 137개·docs lib 285개 성공과 신규 보안 검사 실행 확인. 해당 production job 로그에서 destination stream 오류는 관측되지 않음                                      |
| CodeQL         | [run 40155358267](https://github.com/IMHOJEONG/web-tech/actions/runs/40155358267) 동일 head의 actions·javascript-typescript 모두 SUCCESS, PR merge ref 열린 code-scanning 경고 0건                                                                                                                                                                        |
| 리뷰           | 새 head의 CodeRabbit status는 SUCCESS지만 description은 **Review rate limited**. [봇 댓글](https://github.com/IMHOJEONG/web-tech/pull/60#issuecomment-6392347256)의 무료 OSS 리뷰 한도 소진 안내와 `coveredCommitId: c906573…`를 확인. 새 head 재리뷰 완료로 표기하지 않음. inline thread 0개·정식 review API 0개이며 이전의 주석 비율 경고는 그대로 유지 |
| 나머지 검사    | Documentation·GitGuardian·Vercel Preview 2개 성공. [docs-backend PR build](https://github.com/IMHOJEONG/web-tech/actions/runs/40155360259) 성공은 이미지 게시·NAS 배포가 아님                                                                                                                                                                             |
| 로컬 문서 대조 | `git show --format= --name-status 35a9fcda83b2bfc3a8db01ad1426b85d63091323`로 문서 2개만 변경됨을 확인. `pnpm validate:docs --base c906573284072efcb8aee8bada6b25be4c9c1058`·`pnpm format:changed:check --base c906573284072efcb8aee8bada6b25be4c9c1058` 통과. 코드 수정 지적 없음                                                                        |

초록 상태만 보고 새 리뷰가 수행됐다고 해석하지 않는다. 새 문서는 직접 대조했고 추가 결함은 발견하지 못했으나, 봇의 새 head 검토는 한도 해제 후 별도로 확인할 수 있다. 재리뷰 요청·설정 변경·검사 우회는 하지 않았다. PR은 OPEN·미병합이며 이번 재검증 기록은 로컬 미커밋 변경이다. 나머지 보안 경고 10건과 병합·운영 배포 보류는 유지한다.

## 한계와 후속 작업

- 보안 확인은 공식 패치 버전·audit 경고 제거·정상 기능 및 경계 회귀다. RCE payload를 실행하거나 실제 공격 차단을 재현한 결과가 아니다. macOS 검사는 glibc Linux 네이티브 이미지 처리 검증을 대신하지 않는다.
- 나머지 10건은 production 감사에도 남아 있다. 개발 전용 경고라고 일괄 분류하지 않으며 실제 도달성·개별 패치는 후속 작업이다. unused `web` catalog의 기존 Next 값은 실제 설치/소비자가 아니어서 이번 활성 docs 범위에서 변경하지 않았다.
- 기존 Next-intl webpack cache 경고와 TCP 글의 placeholder-like 문구 경고는 이번 보안 패치와 별개로 유지했다. 검증 실패를 무시한 것이 아니라 후속 실행의 종료 0·실제 결과를 확인했다.
- 위 head의 원격 CI·CodeQL·Linux 회귀·PR 이미지 build와 자동 Preview는 후속 확인했다. 운영 배포와 운영 환경의 취약점 해소는 여전히 미검증이다. lock/workspace 변경은 추후 main 병합 시 Railway·docs-backend 이미지 게시에 영향을 줄 수 있으므로 병합·배포 승인은 별도로 확인한다. 이번 확인에서는 병합·운영 배포를 하지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-25-next-critical.md)
- [기존 경고 추적](../../todo/todo.md)
- [이전 audit 기준](../artifacts/2026-10-24-viteplus-override-audit.json)
