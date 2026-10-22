# KEV 실제 점수와 우선순위 회귀 검증

## 대상과 조건

2026-10-21 KST, 통계 수정 문서 커밋 `93e455c8adaaac35834b1ec4fda25cf92f453a39` 이후 미커밋 작업 트리를 검사했다. 통계 수정의 API `31ddb0a`, 화면 `c2b1d61`, 회귀/CI `1ca8352`, 문서 `93e455c`는 이미 별도 로컬 커밋이며 이번 KEV 변경을 포함하지 않는다.

Node24.12.0·PostgreSQL16 Alpine·Prisma7.8.0·Chromium151.0.7922.34를 사용했다. 임시 DB·실제 Nest·Vite production preview·프록시를 사용하며 구버전·범위 밖 점수·503 조건만 Playwright route로 주입했다. 운영 Railway·Vercel·수집을 검증하거나 변경하지 않았다.

## 재현 방법

[격리 통합 절차](../../runbooks/vuln-radar-local-integration-verification.md)의 Docker·생성 클라이언트·공용 UI 빌드 준비 조건을 따른다. 별도 작업 트리에 실제 .env나 토큰을 복사하지 않는다.

```sh
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend test:e2e --runInBand
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar-backend exec tsc --noEmit -p tsconfig.json
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar-backend lint
mise exec -- pnpm verify:vuln-radar:integration
```

통합 실행기는 Nest를 컴파일하고 Vite production bundle을 만든다. 기존 통계43개·Feed25개 대조와 장애 회귀를 유지하며, 추가 KEV 표본을 테스트 후 삭제한다. 백엔드 중단·DB 삭제는 이 실행기가 만든 격리 자원에서만 일어난다.

## 결과와 증거

### 커밋 완료 후 재검증

[깨끗한 커밋의 최종 통합 증거](../artifacts/2026-10-21T14-58-06-277Z-vuln-radar-integration.json)는 `99bef795f30b518c58e45df9f21aad1a2d989649`, `workingTreeDirty=false`에서 23:58:06–23:58:21 KST에 실행했다. 통계·KEV·기존 장애 회귀16개와 정리6단계가 모두 통과했다. 이전 작업 트리 결과와 구분하며, 이 이후 추가되는 커밋은 실행 결과·문서만 보관하고 런타임 코드를 바꾸지 않는다.

KEV 커밋은 API `1fa7a4e`, 화면 `70ebe01`, 통합 회귀·합성 증거 `6aa03b0`, 계약·검증 문서 `99bef79`다. 같은 구현의 backend34개·frontend15개를 다시 통과했고 두 앱 lint·typecheck, 저장소 도구63개도 재검증했다. 전체 모노레포 build/lint/typecheck를 실행한 것은 아니며 원격 CI 결과는 게시 후 별도로 확인한다.

최종 합성 화면: [KEV1280px](../artifacts/2026-10-21T14-58-06-277Z-vuln-radar-kev-1280.png)·[KEV390px](../artifacts/2026-10-21T14-58-06-277Z-vuln-radar-kev-390.png)·[Feed1280px](../artifacts/2026-10-21T14-58-06-277Z-vuln-radar-feed-1280.png)·[Feed390px](../artifacts/2026-10-21T14-58-06-277Z-vuln-radar-feed-390.png).

### 초기 작업 트리 검사

- [최종 증거](../artifacts/2026-10-21T14-35-59-158Z-vuln-radar-integration.json): 23:35 KST 시작, 16개 통과·실패0·생성 자원 정리6단계 성공.
- [이전 실행](../artifacts/2026-10-21T14-34-05-141Z-vuln-radar-integration.json): 16개 통과. 최종 실행에 범위 밖 점수 대조군과 KEV 화면 증거를 추가했다.
- [1280px KEV 화면](../artifacts/2026-10-21T14-35-59-158Z-vuln-radar-kev-1280.png)·[390px KEV 화면](../artifacts/2026-10-21T14-35-59-158Z-vuln-radar-kev-390.png): 공개 CVE가 아닌 합성 fixture만 사용했다. 모바일 표의 기존 가로 스크롤 구조는 유지했다.

| 조건           | 확인 결과                                                                            |
| -------------- | ------------------------------------------------------------------------------------ |
| Feed 밖 KEV3개 | P0 filler로 Feed25개를 채운 뒤에도 해당 KEV의 실제0·null·0.125가 API와 표에서 유지됨 |
| 0과 미확인     | 0은 숫자0·meter값0·막대0%, null은 미확인·meter없음                                   |
| 실제 우선순위  | P1을 표시하고 추정 대응 상태4종이 표에 없음                                          |
| 중복 권고문    | 같은 CVE에 권고문을 추가해도 화면 행은1개                                            |
| 구버전 응답    | EPSS 필드 생략 시 Feed에 점수가 있는 항목도 미확인·meter없음                         |
| 범위 밖 점수2  | 프런트 응답 검증에서 거부하고 KEV 불러오기 실패로 표시                               |
| KEV503         | 일반 Feed 항목으로 표를 대체하지 않음                                                |
| 연결된 빈 DB   | 실제 KEV API는 database·빈 배열, 표에는 빈 상태 표시                                 |
| 기존 회귀      | 전체 통계·두 화면의 Feed 탐색·인증·중단/복구·토큰 미노출 검사 유지                   |

백엔드 단위34개(이번3개 추가), 프런트 로직15개(이번5개 추가), HTTP4개가 통과했다. 두 앱 lint·typecheck와 통합 실행기 strict/erasable 타입 검사도 통과했다. 실제0·null을 반환하는 DB/API 검사와 구버전/503을 주입하는 화면 대조군을 구분한다.

### PR #54 원격 CI·CodeQL·리뷰 확인

2026-10-22 KST에 [PR #54](https://github.com/IMHOJEONG/web-tech/pull/54)의 head `f2241690e59ad102ea89b08bbe6ed4c8e91c752a`를 조회했다. 앞선 게시 후 확인 대기와 아래 완료 결과를 구분한다. 애플리케이션 코드를 변경하거나 CI를 재실행하지 않고 GitHub 결과·분석 기록·리뷰 스레드·실행 로그를 읽었다.

| 대상             | 관측 결과                                                                      | 근거                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI               | 13개 job 모두 성공, 최종 Test 성공                                             | [run 39622450106](https://github.com/IMHOJEONG/web-tech/actions/runs/39622450106), head SHA 일치. 00:09:55 KST 완료                                                                                |
| 회귀 검사 실행   | backend 34개·frontend test:lib 15개 통과                                       | [Unit and Contract Tests 로그](https://github.com/IMHOJEONG/web-tech/actions/runs/39622450106/job/119299188793). 최종 Test의 unit-contract-tests/docs-browser/offline-reading 모두 success         |
| CodeQL           | Actions·JavaScript/TypeScript 분석 성공, 결과 각 0건                           | [run 39622523589](https://github.com/IMHOJEONG/web-tech/actions/runs/39622523589), analysis ID 1997501111·1997504633. `refs/pull/54/head`와 head SHA 일치, rules_count 각각 17·87, error 빈 문자열 |
| 열린 CodeQL 경고 | 해당 PR head ref 0건                                                           | Code scanning alerts API의 state=open 조회. merge ref가 아니라 실제 분석이 등록된 head ref로 재확인                                                                                                |
| 기타 검사        | Documentation·GitGuardian·Vercel Preview 등 포함 조회된 22개 상태 모두 SUCCESS | PR statusCheckRollup. vuln-radar·web-tech Preview 두 앱 성공. 운영 동작 검증을 의미하지 않음                                                                                                       |
| 리뷰 지적        | 인라인 스레드 0개, 제출된 리뷰 0개                                             | reviewThreads/reviews 조회. 해결 처리할 기존 지적 없음                                                                                                                                             |
| CodeRabbit       | 실제 리뷰 미실행                                                               | [사용량 제한 코멘트](https://github.com/IMHOJEONG/web-tech/pull/54#issuecomment-6319482864)의 Review limit reached. 상태 SUCCESS만으로 코드 리뷰 통과로 해석하지 않음                              |

저장소 루트에서 GitHub 읽기 권한이 있는 `gh`로 조회한다. 아래 head가 달라지면 이전 SHA의 결과를 새 커밋의 성공으로 사용하지 않는다.

```sh
gh pr view 54 --json headRefOid,state,mergeStateStatus,statusCheckRollup,reviews
gh run view 39622450106 --json headSha,status,conclusion,jobs
gh run view 39622450106 --job 119299188793 --log
gh run view 39622450106 --job 119301696139 --log
gh run view 39622523589 --json headSha,status,conclusion,jobs
gh api 'repos/IMHOJEONG/web-tech/code-scanning/analyses?ref=refs%2Fpull%2F54%2Fhead&per_page=20'
gh api 'repos/IMHOJEONG/web-tech/code-scanning/alerts?ref=refs%2Fpull%2F54%2Fhead&state=open&per_page=100'
gh api graphql -f query='query { repository(owner:"IMHOJEONG",name:"web-tech") { pullRequest(number:54) { reviewThreads(first:100) { nodes { isResolved isOutdated path line comments(first:30) { nodes { body url } } } } comments(first:50) { nodes { body url } } } } }'
```

실제 분석이 head ref에 등록되어 있으므로 merge ref 조회만 비었다는 사실은 무경고의 근거가 아니다. 해당 head 분석의 존재·SHA·오류·결과 수와 열린 경고를 함께 대조했다. 현재 지적을 수정하거나 리뷰 스레드를 해결 처리할 대상은 없다. CodeRabbit 재리뷰와 사람의 검토는 별도이며 이번에 자동 재요청·승인·병합하지 않았다.

## 한계와 후속 작업

이 보고서의 초기 검사는 미커밋 작업 트리 기준이다. 후속 사용자 요청으로 KEV도 API·화면·회귀·문서 단위로 분리해 통계 수정과 함께 main 대상 PR #54를 생성했다. 로컬 검증·위 head의 원격 CI 성공·Preview 빌드 성공·운영 동작 검증은 서로 다르다. Production Branch 변경·main 병합·Railway의 신규 API 배포 검증은 이번에 하지 않았다. 운영 관측일·실기기·Safari/Firefox는 미검증이다. 503/범위 밖 점수·백엔드 중단 시 오류 로그는 의도한 대조 조건이며 전체 콘솔 오류0을 주장하지 않는다. 통합의 브라우저 예외 검사는 uncaught pageerror를 대상으로 한다.

EPSS는 저장값이며 최신 FIRST 데이터와 동기화됐음을 검사하지 않았다. 모바일 카드 전환·전체 컬럼의 동시 노출·다른 API 부분 장애를 해결한 것은 아니다.

## 관련 문서

- [KEV 표시 계약](../../architecture/vuln-radar-kev-evidence.md)
- [이번 작업 기록](../../worklog/2026-10/2026-10-21-vuln-radar-kev-evidence.md)
- [KAN-24](https://web-tech-service.atlassian.net/browse/KAN-24)
- [Confluence 운영 안내](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira)
