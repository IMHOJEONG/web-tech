# 나머지 의존성 보안 경고 10건 패치 검증

## 대상과 조건

- 확인일: 2026-10-25 KST. JSON 증거의 시간은 UTC다.
- 기준: 최신 main `d0b25a5122fd9b4377b559270c10680c984e2aed`, 별도 `codex/security-remaining-advisories-20261025` worktree. [KAN-35](https://web-tech-service.atlassian.net/browse/KAN-35)의 나머지 10건을 조치한다.
- [PR #60](https://github.com/IMHOJEONG/web-tech/pull/60)의 재검증 문서 2개는 사용자 승인으로 `e14bfe7`에 커밋·푸시했다. 그 브랜치는 clean으로 보존하며 이번 패치를 섞지 않는다.
- main에는 아직 PR #60의 Next 패치가 없다. 따라서 시작 감사는 10건이 아니라 **13건**이며 Next 3건은 이번 수정 대상에서 제외한다. PR #60과 이번 변경을 합친 통합 결과는 아직 검증하지 않았다.
- 환경: macOS arm64, mise Node 24.12.0·pnpm 12.14.0. 새 보안 fixture는 128 MiB heap·10초·출력 1 MiB 제한의 자식 프로세스를 사용하고 HTTP는 loopback에만 바인딩한다. 운영 API·NAS·Railway·DB는 사용하지 않았다.

## 패치와 영향 범위

| 패키지      | 경고·공식 근거                                                                                                                                                                                                                                                                                | 기존 → 실제 설치 / 안전 하한 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| toml        | High 3건: [array-of-tables](https://github.com/advisories/GHSA-4qx8-w7c3-pj3p), [긴 dotted key](https://github.com/advisories/GHSA-9j65-hcg3-gc64), [큰 정수 변환](https://github.com/advisories/GHSA-9qmh-m7c6-f92p)                                                                         | 5.0.0 → 5.0.1 / `^5.0.1`     |
| zod         | High 1건: [검증 issue 누적에 따른 메모리 고갈](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)                                                                                                                                                                                             | 4.4.2 → 4.6.7 / `^4.6.6`     |
| body-parser | High 1건: [압축 본문 뒤 바이트의 늦은 decoder 오류](https://github.com/advisories/GHSA-27r3-jxmh-p828)                                                                                                                                                                                        | 2.3.0 → 2.4.0 / `^2.4.0`     |
| multer      | High 1건: [요청 종료 뒤 비동기 fileFilter 재개](https://github.com/advisories/GHSA-q7qp-rjg7-q26m)                                                                                                                                                                                            | 2.4.0 → 2.5.0 / `^2.5.0`     |
| fast-uri    | Moderate 2·Low 2건: [scheme decoding](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [상대 참조](https://github.com/advisories/GHSA-xhq7-xmqj-769h), [host 오인식](https://github.com/advisories/GHSA-wjr9-j795-jxcr), [suffix colon](https://github.com/advisories/GHSA-333x-w4r6-6crp) | 4.2.1 → 4.2.3 / `^4.2.3`     |

공식 advisory의 패치 하한과 npm registry의 실제 버전·Node 요구사항·무결성 metadata를 확인했다. toml은 Node >=20, body-parser는 >=18로 현재 Node 24와 호환된다. Zod는 같은 4.x 안정 범위의 4.6.7을 해석했다. 확인한 메이저 범위 밖으로 자동 이동하지 않도록 기존 무제한 toml override도 5.x로 한정했다.

Zod의 docs·docs-backend·공용 콘텐츠 계약 직접 범위와 기존 catalog 두 곳을 올렸다. `zod@^4` override는 Better Auth·ESLint 등 간접 4.x 사본도 같은 패치 하한을 지키도록 하며, 미래의 3.x 요청을 무조건 4.x로 강제하는 전역 override는 아니다. 현재 lock에는 Zod 4.x만 있다. 기존 다른 보안 override·peer 별칭 예외·Next·Vite+·툴체인·배포 설정은 유지한다.

lock 패키지 교체는 대상 5개이며 body-parser의 새 직접 의존성 `content-type@2.1.0`이 추가된다. 기존 `content-type@2.0.0`은 다른 소비자를 위해 유지한다. 동일 버전 metadata 변경은 `better-call`·`zod-validation-error`의 Zod peer 범위 2개다. 그래프에서는 Zod peer suffix 변화와 실제 의존 edge 변화를 구분했다. [감사·그래프 증거](../artifacts/2026-10-25-remaining-advisories.json)에 workspace별 영향을 남겼다.

## 재현 방법

저장소 루트에서 실행한다. 기존 서명·무결성·공급망 검증이나 감사 경고를 끄지 않는다. 마지막 audit 두 명령은 PR #60의 Next 경고가 남아 종료 1이다.

```sh
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- pnpm --filter @web-tech/docs-content-contract test
mise exec -- node --experimental-strip-types --test scripts/security-remaining-advisories.test.mts
mise exec -- pnpm exec tsc --noEmit --types node --module nodenext \
  --moduleResolution nodenext --target es2022 --skipLibCheck --erasableSyntaxOnly \
  scripts/security-remaining-advisories.test.mts scripts/security-fixtures/request-parsers.mts
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
env -u DATABASE_URL -u DIRECT_URL -u SHADOW_DATABASE_URL \
  INGEST_SCHEDULER_ENABLED=false INGEST_SYNC_ON_STARTUP=false \
  mise exec -- pnpm --filter vuln-radar-backend test:e2e --runInBand
env -u DATABASE_URL -u DIRECT_URL -u SHADOW_DATABASE_URL \
  mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter docs test:article:prod
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter vuln-radar typecheck
env -u DATABASE_URL -u DIRECT_URL -u SHADOW_DATABASE_URL \
  mise exec -- pnpm --filter vuln-radar-backend typecheck
mise exec -- pnpm --filter docs lint
mise exec -- pnpm --filter vuln-radar lint
mise exec -- pnpm --filter vuln-radar-backend lint
mise exec -- pnpm peers check
mise exec -- pnpm validate:catalog
mise exec -- pnpm install --frozen-lockfile --offline
mise exec -- pnpm audit --json
mise exec -- pnpm audit --prod --json
```

`pnpm --filter vuln-radar test`는 해당 script가 없어 검사를 실행하지 않는다. 실제 결과는 명시적인 `test:lib`의 32개다. 새 worktree에는 운영 `.env`를 복사하지 않는다. API E2E는 mock storage이며 Prisma generate/build는 코드 생성만 수행하고 migration·seed·DB 접속을 하지 않는다.

그래프 비교는 기존 `resolveVerificationBaseline`에 위 main 전체 SHA를 명시하고 `compareGraphs`로 모든 workspace를 대조했다. 이동하는 HEAD를 기준선으로 대체하지 않았다. 이 보고서의 명령은 운영 배포나 원격 CI 실행을 뜻하지 않는다.

## 결과와 증거

| 검사             | 관측 결과                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 전체 audit       | 13건 → **3건**, 대상 GHSA 10개 제거. 잔여는 PR #60 범위의 Next Critical 2·High 1뿐                                                                           |
| production audit | 같은 Next 3건만 잔여. 전체 보안 정상이나 운영 패치 완료로 표시하지 않음                                                                                      |
| 신규 보안 검사   | **16개 통과**. 버전·prerelease 하한, 모든 lock 사본·실제 설치 경로, TOML BigInt 전 guard, 소비자 4곳의 Zod 계약, URI 4종, 양쪽 Nest 앱의 요청 파서 종료 검사 |
| 기존 자동 검사   | 저장소 147개·docs lib 285개·공용 콘텐츠 계약 22개·vuln-radar lib 32개 통과                                                                                   |
| 백엔드           | docs-backend 단위 13개·API 계약 34개·lint·타입·build 통과. vuln-radar-backend 단위 48개·mock API 6개·lint·타입·Prisma generate/build 통과                    |
| production 문서  | 로컬 Chromium 모바일/데스크톱·ko/en·로컬/원격 합성 콘텐츠·검색/게시/무효화·Link/직접 URL·503/종료 대조 **154개 통과**. 이 브랜치의 Next는 아직 16.3.8        |
| 나머지 호환      | docs/vuln-radar lint·타입, vuln-radar Vite+ build, 신규 테스트 TS 검사, peer 0건·catalog 11개 manifest·frozen/offline 설치 통과                              |

### 초기 실패와 검사 한계

- 패치 전 설치 패키지로 첫 15개 검사를 실행했을 때 4개 통과·11개 실패했다. 이때 설정·lock은 이미 갱신됐으나 node_modules는 기준 버전이어서 lock 검사와 실제 실행의 차이도 드러났다. TOML의 큰 정수 변환 진입, URI 4종 오인식, 두 Multer 자식 프로세스의 `Unexpected end of form` 미처리 오류를 확인했다. Zod 4곳은 버전 하한 거부이며 OOM 직접 재현이 아니다.
- body-parser의 작은 deflate·지연 tail fixture는 이전 버전에서도 통과했다. 이는 패치 설치 경로 확인·호환 대조이며 해당 환경에서 원래 crash를 직접 재현했다는 증거가 아니다. 큰 공격 입력을 계속 늘려 실행하지 않았다.
- 초기 검사기의 CLI 기본 entry 해석은 실패했다. bin 중심 패키지의 `package.json`에서 의존성을 해석하도록 수정했다. 패치 후 첫 실행은 14/15 통과였으며 `a/../b`의 정규화를 입력 그대로라고 가정한 기대값만 잘못됐다. 실제 안전한 `b`와 절대 base에 대한 동일한 resolution target을 함께 검사하도록 보완했다. `../x` 보존과 다른 URI 거부 조건은 유지했다. 설치 경로 gate 1개를 더해 최종 16개를 검사했다.
- docs lib 최초 실행은 공용 UI build가 선행되지 않아 실패했고, 별도 typecheck도 UI 출력 재생성 시점에 모듈을 찾지 못했다. 선행 build와 출력 완료 후 같은 검사를 재실행해 통과했다. 타입 검사나 앱 코드를 완화하지 않았다.
- 설치 prepare의 worktree `.git/hooks` ENOTDIR 안내는 기존 simple-git-hooks 가정이다. install 종료는 0, 공급망 정책은 유지했다. 기존 다른 worktree나 훅 설정을 수정하지 않았다. dotenv skill 승인 요청도 이번 보안 작업과 무관하여 실행하지 않았다.
- production E2E에는 의도적인 응답 종료 대조의 기존 `destination stream closed early` 로그가 관측됐다. 이 main 기반 브랜치에서는 기존 Next와 검사를 유지했다. 로그를 숨기거나 새 원인 판정을 하지 않았고 전체 154개는 성공했다. PR #60의 새 Next 결과와 혼동하지 않는다.

## 한계와 후속 작업

### 병합 전 CodeQL #42 보완

PR #61 최초 head `a0c728e`의 CI 13개 job은 성공했으나 CodeQL 집계는 High 1건으로 실패했다. [경고 #42](https://github.com/IMHOJEONG/web-tech/security/code-scanning/42)는 테스트 fixture `request-parsers.mts`가 파싱한 요청 값을 HTTP 응답으로 반사하고 JSON Content-Type을 명시하지 않은 경로다. loopback 자식 프로세스 전용 코드로 운영 endpoint는 아니지만 경고를 dismiss하거나 검사에서 제외하지 않았다.

파싱한 요청의 정확한 값을 assert하는 검증은 유지하고 응답은 고정 JSON으로 변경했다. `Content-Type: application/json; charset=utf-8`·`X-Content-Type-Options: nosniff`를 명시하고 클라이언트 fixture에서도 두 헤더를 검사한다. 원격 CodeQL 재검사로 해소를 확인하기 전에는 해결 완료로 표시하지 않는다. 로컬 신규 16개가 통과했고 저장소 회귀를 함께 재검사한다.

`refs/pull/61/merge` 조회가 0건이어도 집계 상태와 `refs/pull/61/head`의 결과가 다를 수 있다. 이번 경고의 most_recent_instance는 head ref였다. 따라서 집계 check의 annotation, 경고 번호와 대상 ref·commit을 함께 확인한다. 재현 명령은 `gh api repos/IMHOJEONG/web-tech/check-runs/121061928469/annotations`와 `gh api repos/IMHOJEONG/web-tech/code-scanning/alerts/42`다. merge ref의 0건만으로 PR 전체에 경고가 없다고 판단하지 않는다.

- 최초 검증은 별도 브랜치의 로컬 미커밋 변경으로 수행했다. 후속 사용자 승인으로 패치·회귀·문서를 작업별 커밋하고 main 대상 별도 PR로 검토한다. main 병합·Railway/NAS·운영/수동 배포는 승인 범위가 아니며 KAN-35 전체를 완료로 바꾸지 않는다.
- macOS의 제한된 회귀와 패치 하한·audit 제거가 모든 공격 도달성·OOM 방어를 증명하지 않는다. Linux 이미지·실제 운영 API·운영 DB·배포는 미검증이다. 프런트·백엔드 보안 경고가 단순 개발 전용이라고 일괄 분류하지 않았다.
- PR #60 병합 후에는 이 브랜치 기준 갱신과 lockfile 재해석·audit·통합 회귀가 필요하다. 두 패치가 각자 통과했다는 사실만으로 결합 audit 0건·동시 배포 성공을 확정하지 않는다. 겹치는 목차·TODO·workspace/lock 변경도 그때 검토한다.
- 패키지 하한과 fixture를 추가하는 보완이며 새 아키텍처 결정을 만들지 않아 ADR은 추가하지 않았다.

### 후속 커밋 분리와 원격 검토 범위

| 작업             | 커밋           | 범위                                                     |
| ---------------- | -------------- | -------------------------------------------------------- |
| 보안 패키지 패치 | `3c4549b`      | workspace·lock·Zod 직접 소비자 3개 manifest, 총 5개 파일 |
| 보안 회귀        | `bcfe95d`      | 실제 의존 경로 검사와 제한된 파서 fixture 2개 파일       |
| 검증 문서        | 별도 문서 커밋 | 이 보고서·worklog·감사/그래프 증거·TODO·목차 7개 파일    |

커밋 분리 중에도 신규 16개·저장소 147개를 재실행해 통과했다. 기존 pre-commit의 읽기 전용 포맷·문서 검사와 commit-msg 검사를 유지했고, 설치 시 prepare 안내와 실제 커밋 훅 동작은 구분한다. 사용자 승인은 해당 브랜치 푸시·main 대상 별도 PR 생성까지다. 자동 Preview·PR build와 운영 배포를 구분하며, 새 head의 원격 CI·CodeQL·리뷰는 실제 결과를 확인하기 전까지 미검증이다. 원격 커밋·PR 연결은 Jira·Confluence의 같은 작업 기록에 남긴다.

### 승인된 main 병합과 결합 검증

후속 사용자 승인은 PR #60·#61의 squash 병합과 그에 따른 Vercel·Railway 자동 배포·docs-backend 이미지 게시까지다. 수동 배포·NAS 컨테이너 교체는 제외한다. 앞선 미병합·배포 보류 기록은 당시 범위이며 이번 승인으로 자동 실행 범위만 변경됐다.

PR #60은 `51cdb40de7577090950d0c6b3024bee6fdb2222c`로 main에 실제 병합됐다. PR #61의 기존 head `9c7ce8c`에 이 main을 통합했다. 충돌은 TODO·검증/증거/월별 목차 4곳으로 양쪽 문서 링크를 보존했고, 자동 병합된 workspace·lock은 frozen install로 검증했다. 의존성 재해석이나 추가 버전 변경은 하지 않았다. [결합 검사 원본](../artifacts/2026-10-25-security-combined.json)에 입력 SHA·lock hash·감사 metadata·실행 결과를 남겼다.

| 결합 검사             | 결과                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| 전체·production audit | 각각 종료 0, Critical·High·Moderate·Low 모두 0건. 기존 분리 감사 13→3과 구분               |
| frozen install        | 1,643개 lock entry 공급망 검사 통과·해석 생략·lock 변경 없음                               |
| 저장소·콘텐츠         | repo 153개, docs lib 285개, 콘텐츠 계약 22개, vuln-radar lib 32개 통과                     |
| 백엔드                | docs-backend check 성공(단위 13·API 34·lint·타입·build), vuln-radar-backend 단위 48개 성공 |
| production E2E        | 결합된 Next 16.4.3에서 모바일/데스크톱 154개 통과(1.6분)                                   |
| 의존성 계약           | peer 0건·catalog 11개 manifest 검사 통과                                                   |

재현은 위 명령에서 기준 main을 `51cdb40`과 결합된 작업 트리로 바꾸고 실행했다. 첫 `install --frozen-lockfile --offline`은 @next/env 캐시 metadata 부족으로 실패했고 온라인 frozen 설치에서 공급망 검증을 그대로 유지해 통과했다. 제한된 sandbox의 최초 production E2E도 loopback listen EPERM으로 시작하지 못했다. 허용된 로컬 listener에서 같은 검사로 재실행했으며 assertion·timeout·retry를 바꾸지 않았다. 기존 콘텐츠 경고·의도적 503 대조 로그를 숨기지 않았다.

PR #61의 통합 전 head는 CI 13개 job·CodeQL이 성공했고, High #42는 fixed·관련 스레드 자동 해결 상태를 확인했다. CodeRabbit은 실제 `9c7ce8c`까지 검토해 actionable 0개였으며 lockfile 제외·주석 비율 권고는 한계로 유지한다. **통합 커밋의 새 CI·CodeQL·리뷰는 별도 재검증 대상**이며 이 로컬 결과로 대체하지 않는다.

PR #60의 자동 실행에서는 GitHub의 `Production – web-tech`·`Production – vuln-radar` 환경 배포 성공과 Railway development 서비스의 동일 SHA·SUCCESS/RUNNING·`GET /api/health` status ok를 확인했다. 최초 `/health` 요청은 전역 `/api` prefix를 누락해 404였으며 실제 라우트 재조회와 구분한다. [main 이미지 workflow](https://github.com/IMHOJEONG/web-tech/actions/runs/40159712576)는 linux/amd64 이미지 `sha-51cdb40de7577090950d0c6b3024bee6fdb2222c`의 게시와 digest `sha256:b4cf6670fc0facc8b9678ff03064690c863090a2a8caad188607923ef77bb393`를 기록했다. 이는 NAS의 실행 이미지 교체나 PR #61 운영 적용을 뜻하지 않는다. 두 번째 PR의 실제 병합·새 main CI·배포 식별자는 Jira·Confluence의 같은 KAN-35 기록에서 후속 확인한다.

### main 오프라인 실패 재발과 미채택 대조

PR #60의 자동 배포는 성공했지만 [main CI 40159712630](https://github.com/IMHOJEONG/web-tech/actions/runs/40159712630)은 오프라인 desktop 1건 실패·37건 통과였다. PR #61 통합 head `f63aa05`에서도 같은 suite 실패를 확인했다. 따라서 앞선 헤더 보정의 로컬·PR 통과를 안정적 해소나 main CI 성공으로 확대하지 않는다. 다른 job과 배포 성공은 실패한 오프라인 검사를 대체하지 않는다.

main의 `docs-offline-40159712630-1` artifact에서 지연된 HTTP 200 RSC 요청은 9,521ms에 헤더, 9,632ms에 `request-failed`, 9,702ms에 URL commit, 10,060ms에 본문 표시를 기록했다. trace에는 `net::ERR_ABORTED`가 있어 단순 관측 종료 race로 분류하지 않는다. gzip 제거 이후에도 재발했으므로 압축 헤더만을 유일 원인으로 판단하지 않는다.

이 검사는 **지연된 실제 Link 응답이 본문 표시 이후의 UI 검사 시간을 소비하지 않는지**와 같은 요청의 `response-finished` 관측을 함께 요구한다. 둘 중 어느 계약을 바꿀지 결정하기 전에 다음을 임시 대조했다. 아래 실험은 안정적 해결을 입증하지 못해 전부 폐기했으며, 앱·관측 helper·assertion·timeout·retry와 테스트 위치는 기존 head 상태로 복구했다.

| 임시 대조                                            | 실제 관측과 한계                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `route.fetch/fulfill` 대신 원래 요청 dispatch만 지연 | 단독 반복 10/10 성공, 전체 suite는 다시 37/38. 본문 재생만이 원인이라는 가설 불충분                                                    |
| 서버 컴파일 선행·브라우저 reload                     | 전체 suite 37/38. 냉간 개발 컴파일만의 문제라고 확정하지 못함                                                                          |
| 브라우저 AbortController/stream cancel 임시 계측     | 해당 실행은 단독·전체 모두 성공하고 취소 호출 스택이 없었음. 실패 경로의 호출자를 찾았다는 근거가 아니며 timing 영향 배제 못함         |
| production build/start로 같은 assertion 이동         | 첫 반복 1/6만 성공. 나머지는 선행 prefetch가 지연 gate를 우회해 URL이 먼저 바뀜. 새로운 fixture 조건 문제와 기존 전송 완료 실패를 구분 |
| production에서 prefetch까지 gate 또는 명시 차단      | 각각 반복 5/6 성공, 같은 전송 완료 assertion 1개 실패. dev/HMR 전용 문제라는 결론도 불충분                                             |

본문이 표시됐다는 사실을 전송 완료 증거로 쓰지 않는다. `request-failed`를 `response-finished`로 바꾸거나 관측된 취소를 정상으로 분류하지 않는다. 반대로 위 결과만으로 운영 사용자에게 본문 표시 장애가 발생했다고 단정하지 않는다. 알려진 사실은 HTTP 200·본문 표시 이후에도 동일 요청의 완료 이벤트를 요구한 검사가 실패했다는 점이며, 중단 호출자·항상 같은 단일 원인·프레임워크 정상 동작 여부는 미확정이다.

```sh
gh run download 40159712630 --repo IMHOJEONG/web-tech \
  --name docs-offline-40159712630-1 \
  --dir /tmp/web-tech-pr60-main-offline-failure-20261025
mise exec -- pnpm --filter docs test:offline \
  --grep 'healthy delayed' --repeat-each=5
mise exec -- pnpm --filter docs test:offline
mise exec -- pnpm --filter docs typecheck:node-test
mise exec -- pnpm --filter docs exec eslint offline-e2e/article-navigation.spec.ts
```

위 재현 명령은 현재 유지한 원래 fixture를 실행한다. 임시 production 실험 파일·컴파일 warmup·브라우저 계측은 남기지 않았다. 사용자에게 UI 완료와 전송 완료·중단 검사를 별도 계약으로 분리할지, 기존 엄격한 조건을 유지하고 중단 원인 조사를 계속할지 재확인했다. 그 결정과 필수 검사 해소 전에는 PR #61을 병합하지 않는다. 실패한 main 이력·원격 artifact는 삭제·재작성하거나 강제 통과시키지 않는다. 결합 audit 0건·기존 production 154개 성공과 이번 미해결 검사는 별개다.

### 승인된 UI·전송 검사 분리

후속 사용자 승인으로 UI 완료와 전송 완료·중단을 서로 다른 계약으로 검사한다. 실제 Link 지연 검사는 URL commit 뒤 비어 있지 않은 본문·로딩 제거·동일 document 유지·진행 표시 시작/종료를 계속 요구한다. 단, 같은 요청의 `response-finished`가 있어야 UI가 준비됐다고 간주하는 잘못된 결합 조건을 제거했다. raw 관측 보고서의 `request-failed`·`pendingRequestIds`는 그대로 남으며 UI 통과를 전송 성공이나 취소 원인 확인으로 바꾸지 않는다.

전송 완료 조건은 별도 loopback fixture로 유지·보강했다. navigation RSC와 prefetch 각각 HTTP 200 헤더만으로는 완료가 아니며 실제 body drain 뒤 동일 request ID의 `response-finished`를 요구한다. UI는 준비됐지만 스트림이 열린 대조에서 pending `[1]`·완료 없음·실패 없음, 200 이후 강제 중단 대조에서 동일 request ID의 `request-failed`·완료 없음·pending 없음도 검사한다. 기존 503·헤더 이전 네트워크 실패·로딩/빈 본문·관측 종료 시 pending·document 교체 검사는 유지한다.

`navigation-observer.ts`, 앱 코드, 운영 분류기, timeout·retry 0·CI 필수 job은 변경하지 않았다. 테스트를 다른 suite로 옮기거나 production 전용 조건으로 숨기지 않는다. [ADR-0008](../../architecture/adr-0008-request-lifecycle-observability.md)의 화면 완성과 전송 상태 분리 원칙을 테스트에 적용한 것이며 앞선 실제 ERR_ABORTED의 내부 호출자는 여전히 미확정이다.

```sh
mise exec -- pnpm --filter docs test:offline
mise exec -- pnpm --filter docs test:offline \
  --grep 'independently|stream is still pending|interrupted RSC|distinguishes response headers' \
  --repeat-each=3
mise exec -- pnpm --filter docs verify:offline-evidence
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec eslint \
  offline-e2e/article-navigation.spec.ts offline-e2e/navigation-observer.spec.ts
mise exec -- pnpm test:repo
```

로컬 전체 오프라인 44개·핵심 반복 30개·저장소 153개·docs 타입·대상 lint를 통과했다. 제어된 실패의 JSON/HTML·관측 attachment·trace 보존 검사도 성공했고 전체/production audit은 0건이다. [44개 실행과 핵심 관측 원본](../artifacts/2026-10-25-ui-transport-contract.json)에 기준 head·수정 코드 blob hash·본문 표시 중 pending·200 뒤 중단·정상 완료의 실제 event metadata를 보존했다. 새 PR head CI·CodeQL·리뷰·병합·자동 배포는 각각 실제 결과를 확인한 후 별도 기록한다. 과거 main/통합 CI 실패는 이 새 계약의 성공으로 재작성하지 않는다.

### NAS 적용 후 외부 재검증

**2026-10-25 당시의 관측 기록입니다.** 아래 이미지 ID·태그·digest와 교체 안내는 당시 비교 과정의 증거이며, 현재 권장 이미지나 안전한 rollback 대상으로 사용하지 않습니다. 이후 Node 보안 패치와 실제 실행 이미지의 안전성은 [현재 NAS 배포 절차](../../runbooks/docs-backend-nas-deployment.md#update-and-rollback)에 따라 별도로 확인해야 합니다. 2026-10-29에는 보존된 기록만 이식했으며 새 API 조회·NAS 접속·파일 수정·이미지 교체·운영 검증을 수행하지 않았습니다.

2026-10-25 KST 사용자로부터 NAS 이미지 교체와 읽기 전용 조회 결과 `image=ghcr.io/imhojeong/web-tech-docs-backend:latest revision= health=healthy`를 전달받았다. 이는 내부 healthcheck 성공을 뜻하지만 mutable `latest`와 빈 revision으로 실행 이미지의 main 커밋을 확정하지 않는다. NAS SSH·Docker 원격 제어·설정 변경·재배포는 수행하지 않았다.

| 확인 항목      | 결과                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| 인증 없는 목록 | `GET https://api.heap-forge.app/api/posts`는 401                                               |
| 인증된 목록    | 200, canonical 응답 schema 통과, 문서 1개                                                      |
| 인증된 본문    | `/posts/web/browser` 200, HTML article 존재, frontmatter 노출 없음                             |
| 보호 응답 캐시 | 목록·본문 모두 `Cache-Control: private, no-store`, `Vary: Authorization`, Cloudflare `DYNAMIC` |
| 외부 health    | `/health` 200, JSON `service=docs-backend`, `status=ok`                                        |
| 실행 버전      | 미확인. 사용자 제공 healthy와 registry 게시 성공을 동일 이미지 실행 증거로 대체하지 않음       |

기존 서버 전용 토큰은 프로세스 내부에서만 읽어 고정 HTTPS API origin으로 전송했고 redirect를 거부했다. 토큰·인증 헤더·본문 원문은 출력·저장하지 않았다. 호출별 12초 제한을 적용했으며 목록과 공개 문서 1개만 읽었다. 본문에 코드 블록이 없어 코드 하이라이팅 동작은 이번 표본으로 검사하지 않았다. 앞선 sandbox fetch의 TypeError는 네트워크 허용 후 동일 health GET으로 재검사해 실제 JSON 200과 구분했다.

공개 health 200은 [NAS 운영 절차](../../runbooks/docs-backend-nas-deployment.md)의 외부 403/404 조건과 다르다. 비밀 노출이나 패치 실패를 의미한다고 단정하지 않지만 perimeter 정책의 후속 조치 대상으로 남긴다. 내부 healthcheck는 유지하고 외부 reverse proxy/Tunnel 경로에서만 차단 여부를 검토해야 하며 이번에는 변경하지 않았다.

NAS에서 다음 읽기 전용 명령으로 **컨테이너가 실제 실행 중인 이미지 ID**의 RepoDigests를 확인한다. `docker image inspect ...:latest`만 조회하면 실행 컨테이너와 다른 이미지를 볼 수 있다. 아래 명령은 토큰·환경 변수를 출력하지 않는다.

```sh
docker image inspect "$(docker inspect docs-backend-docs-backend-1 --format '{{.Image}}')" \
  --format 'id={{.Id}} digests={{json .RepoDigests}} revision={{index .Config.Labels "org.opencontainers.image.revision"}}'
```

기대 게시 이미지의 index digest는 `sha256:cecbee82ff2ced023c7caedfc5dc1dfc45e9d185632722ad7caefc943e46e8a2`, linux/amd64 manifest digest는 `sha256:ca68b61b95d34e9180dbe26d1955dc07843a8142024f490abc9c744a55dcbf23`다. image config ID와 manifest digest는 서로 다른 식별자이므로 직접 같은 값으로 비교하지 않는다. RepoDigests가 비어 있거나 다른 경우 추가 식별이 필요하며, 현재는 새 이미지 실행 및 NAS의 해당 취약점 패치 적용을 확정하지 않는다.

후속으로 사용자는 필드 이름 없는 해시 `63a0c214f3aa5a2a346f54a1fc3ad1c3c8530491813c522d8880bf70ace005e4`를 제공했다. 기대 linux/amd64 manifest를 `docker buildx imagetools inspect --raw ghcr.io/imhojeong/web-tech-docs-backend@sha256:ca68b61b95d34e9180dbe26d1955dc07843a8142024f490abc9c744a55dcbf23`로 직접 읽었으며 `config.digest`는 `sha256:fc93f615edd8dc4d5e5a70c824d93ca79216b4f4fead765c0405ba521de2d60f`다. 두 해시는 다르지만 사용자가 제공한 값의 필드가 확정되지 않아 이미지 불일치나 이전 버전 실행으로 단정하지 않는다. `id=... digests=...` 전체 한 줄을 재요청했다. 최초 sandbox DNS 실패 후 네트워크 허용 재조회는 종료 0이며 NAS를 제어하거나 이미지를 pull하지 않았다.

최종 사용자 출력은 `id=sha256:63a0c214f3aa5a2a346f54a1fc3ad1c3c8530491813c522d8880bf70ace005e4 digests=[]`다. 이제 제공 값이 실제 실행 이미지의 config ID임을 확인했으므로 **검증한 main4e80275 게시 이미지와 실행 이미지가 다르다**고 판정한다. RepoDigests가 없다는 사실만으로 로컬 빌드·파일 load·구버전 여부를 확정하지 않으며, 다른 config ID 역시 패치 누락이나 취약점 존재 자체의 증거는 아니다. NAS의 동일 보안 패치 적용은 미확인으로 유지한다. 앞선 healthy·API 정상은 이 버전 판정을 대체하지 않는다.

운영자 후속으로 [기존 업데이트 절차](../../runbooks/docs-backend-nas-deployment.md#update-and-rollback)에 따라 콘텐츠 백업·기존 이미지 보존 후 `DOCS_BACKEND_IMAGE`를 검증한 `sha-4e80275e5f78863687b78e237c4c6c5e1577641c` 태그 또는 위 immutable manifest digest로 고정하고, 같은 환경 파일·Compose 프로젝트·볼륨 설정을 유지해 pull과 `up -d --no-build docs-backend`를 수행하도록 안내한다. 단일 컨테이너 교체 중 잠깐 중단될 수 있다. pull만으로 실행 컨테이너는 교체되지 않는다. 에이전트는 이 교체를 실행하지 않았으며 완료 후 실행 이미지 ID·health·인증 API를 다시 확인해야 한다.

#### 재교체 후 이미지 일치와 문서 0개

사용자가 재교체 후 실제 실행 이미지의 `id=sha256:fc93f615edd8dc4d5e5a70c824d93ca79216b4f4fead765c0405ba521de2d60f`, RepoDigests의 `ghcr.io/imhojeong/web-tech-docs-backend@sha256:cecbee82ff2ced023c7caedfc5dc1dfc45e9d185632722ad7caefc943e46e8a2`를 제공했다. 기대 config ID와 index digest가 모두 일치하므로 사용자 제공 실행 정보 기준으로 main4e80275 게시 이미지 적용을 확인한다. 이전 ID 불일치 기록은 교체 전 상태로 유지한다. NAS에 직접 접속한 검증이나 새 컨테이너 healthy 확인으로 확대하지 않는다.

같은 고정 HTTPS origin·기존 서버 토큰·redirect 거부·호출별 12초 제한으로 다시 읽었다. 무인증 목록401, health200 JSON status ok, 인증 목록200·canonical schema 통과·private,no-store·Vary Authorization·CF DYNAMIC은 유지되지만 **목록은 이전 1개에서 현재 0개**다. 상세 조회 표본이 없어 새 컨테이너의 본문 정상 여부는 미검증이다. 이미지 적용 성공과 콘텐츠 제공 정상화를 분리하며 전체 운영 완료로 표시하지 않는다. 공개 health 정책 차이도 유지한다.

문서 삭제가 의도됐는지 사용자에게 확인하고, 아래 읽기 전용 파일 개수 조회를 요청했다. 콘텐츠 mount 누락·다른 host 경로·draft·frontmatter/본문 검증 제외는 가능성이며 현재 원인 확정이 아니다. 파일·토큰·환경 변수 내용은 출력하지 않는다.

```sh
docker exec docs-backend-docs-backend-1 node -e 'const fs=require("node:fs"); console.log("markdownFiles="+fs.readdirSync("/app/content/posts",{recursive:true,withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith(".md")).length)'
```

후속 NAS 파일 개수 조회는 사용자 제공 `markdownFiles=2`다. 재귀 조회로 `.md` 2개가 보인다는 뜻이며 백엔드가 읽는 채널 직하에 있거나 이전과 같은 볼륨이라는 증거는 아니다. `ContentRepository.findInChannel`은 정해진 채널의 직하 `.md`만 읽고 하위 폴더를 재귀 탐색하지 않는다. `parseDocumentFrontmatter`는 status 생략 시 draft로 처리하며 `ContentService`는 published만 반환한다. 필수 frontmatter·파일명과 slug 일치·본문 hard failure 검증도 별도 제외 조건이다. NAS 파일 경로와 최근 `Skipping invalid content document` 경고를 요청했으며 실제 제외 원인은 미확정이다. 경고가 없다는 사실로 draft나 미탐색 경로를 배제하지 않고 사용자 승인 없이 공개 상태를 바꾸지 않는다.

후속 사용자 출력에서 `/app/content/posts/feed/pna.md`와 `/app/content/posts/web/browser.md`는 모두 지원하는 채널 직하 경로임을 확인했다. `ContentService` 경고는 `web/browser`의 body validation 실패를 명시한다. 본문 기준 line 2의 H1, line 16·49·82·131의 HTML 주석이 이유다. validator 호출 입력이 frontmatter를 제외한 content이므로 이 번호는 원본 파일 전체 줄 번호와 다를 수 있다. 서비스는 `issues.failures.slice(0, 5)`만 로그에 넣으므로 표시된 다섯 건이 전부라는 보장도 없다.

운영자에게 NAS 원문에서 frontmatter title과 중복하는 본문 제목을 직접 제거하고, 작성 메모용 HTML 주석은 제거하거나 미완성 글이라면 draft를 유지하도록 안내한다. HTML 주석 자체를 설명하는 코드 예시는 언어를 지정한 fenced code block으로 표현해야 하며 검사 우회를 위한 일괄 감싸기는 하지 않는다. 에이전트의 H1 자동 H2 변환·본문 변경·검증 완화는 없다. `feed/pna`는 이번 경고에 없으므로 draft나 다른 원인으로 확정하지 않고 frontmatter status 확인을 후속으로 남긴다. 원문 변경은 API 요청 시 다시 읽으므로 NAS 문서 수정만으로 컨테이너 재빌드는 필요하지 않다. 수정 후 목록·본문과 프론트 캐시 반영은 별도 검증이다.

사용자는 `feed/pna`의 status 누락을 확인하고 추가했다고 보고했다. 이후 같은 인증 API를 다시 조회했지만 목록200·schema 통과·0개(pna/browser 모두 없음), `/posts/feed/pna`는404였다. 두 보호 응답의 private,no-store·Vary Authorization·CF DYNAMIC과 무인증 목록401은 유지된다. 따라서 status 수정 보고만으로 문서 공개 정상화를 선언하지 않는다. 새 요청이 생성한 pna 전용 Skipping/Rejected 경고를 요청했고, 경고가 없으면 실제 status 값과 실행 컨테이너에 마운트된 파일 수정 여부를 확인해야 한다. 추가된 값·파일 반영·다음 검증 실패는 아직 직접 확인하지 못했으며 원인을 추정 확정하지 않는다. NAS 파일·설정·캐시를 변경하지 않았다.

이후 사용자 경고는 pna의 `updatedAt`이 undefined여서 published frontmatter schema가 거부한 사실을 명시했다. 사용자가 이를 추가한 뒤 재검증했지만 목록200/schema통과/0개·pna상세404는 유지됐다. 무인증401과 보호응답 캐시정책은 정상이다. 따라서 알려진 updatedAt 누락과 수정 이후 남은 제외 원인을 구분한다. 실행 컨테이너에서 pna 원문을 읽어 배포된 `parseDocumentFrontmatter`·공용 본문 검증기를 직접 호출하고 status·slug 일치·issue path/code/message·본문 규칙 결과만 출력하는 읽기 전용 명령을 요청했다. 본문·토큰·환경 변수 전체는 출력하지 않으며 검증완화·파일변경·재배포는 하지 않는다. 추가 오류 또는 수정 반영 문제 중 실제 원인은 결과 대기다.

사용자가 위 컨테이너 검사 결과 `status=published`, `slugMatchesFile=false`, 본문 failures `line 2: h1 is reserved for frontmatter title`와 `first heading should start at h2 or h3`를 제공했다. 해당 실행에서는 frontmatter 파싱이 통과했으므로 updatedAt을 포함한 메타데이터 schema 문제와 이후의 slug 일치·본문 정책 실패를 구분한다. 서비스는 schema 이후 slug를 먼저 검사하므로 실제 API 경고는 우선 파일명 불일치로 나타날 수 있다. 파일명 pna.md를 유지하면 frontmatter slug는 pna여야 하고, 본문의 중복 H1은 운영자가 직접 제거하며 실제 첫 섹션은 H2/H3로 작성한다. 같은 H1이 두 실패를 유발할 수 있어 세 독립 원인으로 집계하지 않는다. 수정·수정 후 API 성공은 아직 확인하지 않았으며 에이전트의 자동 제목 변환·NAS 문서 수정은 없다.

사용자가 pna slug·본문 H1을 수정했다고 보고한 뒤 원격 API를 다시 조회했다. 인증 목록은200·schema통과지만0개(pna/browser 없음), pna 상세404이며 무인증401·보호응답 private,no-store/Vary Authorization/CF DYNAMIC은 유지된다. 이는 프론트 화면 확인이 아니라 원격 API 직접 조회 결과다. 수정 반영 또는 추가 검증 실패의 실제 원인은 새 pna 제외 경고로 확인하도록 요청했고, 사용자 수정 보고만으로 해결 처리하지 않는다. NAS 파일 변경·재배포·웹훅 호출은 하지 않았다.

사용자 후속 경고는 pna의 `body validation failed: line 2: h1 is reserved for frontmatter title; first heading should start at h2 or h3`다. 해당 요청은 ContentService의 published frontmatter·slug 일치 검사를 통과하고 본문 검증까지 도달했으므로 이전 slug 불일치와 구분한다. 로그 시점의 본문 H1은 여전히 남은 차단 원인이며 현재 파일이나 수정 성공으로 추정하지 않는다. 실제 편집 파일과 mount source 일치 여부도 확인 대상이다.

동시에 보인 ExpressAdapter의 `Content-Type doesn't match Reply body`는 별도 응답 헤더 경로다. ContentController 상세 메서드는 `@Header('Content-Type', 'text/html; charset=utf-8')`를 선언하지만 검증 실패 시 NotFoundException이 JSON 오류 객체를 만든다. 설치된 `@nestjs/platform-express/adapters/express-adapter.js` line 61~67에서 비JSON Content-Type과 statusCode>=400을 감지해 경고 후 application/json으로 보정하는 코드를 확인했다. 따라서 이 경고가 문서 제외를 유발한 것은 아니며 custom ExceptionFilter가 반드시 필요하다는 의미도 아니다. 성공 응답에만 HTML 헤더를 설정하는 보완과 HTML200/JSON404 회귀는 별도 후속으로 남긴다. 이번에는 앱 코드·검증 규칙·NAS 문서를 바꾸지 않았다.

사용자 재조회 요청으로 2026-10-25 21:29:36 KST(12:29:36 UTC)에 다시 확인했다. 목록200/schema통과/0개·pna상세404·무인증401이며 보호응답 private,no-store/Vary Authorization/CF DYNAMIC이 유지된다. 본문 article은 없고 수정 반영 성공은 아직 확인되지 않았다. 새 NAS 경고나 mount 조회를 직접 수행한 결과는 아니므로 과거 H1 로그만으로 이번 요청의 원인을 확정하지 않는다. 서버·파일·자격증명·캐시 변경은 없다.

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-25-remaining-advisories.md)
- [기존 13건 추적](../../todo/todo.md)
- [Vite+ 보존 감사](../artifacts/2026-10-24-viteplus-override-audit.json)
- [PR #60 재검증 원본](https://github.com/IMHOJEONG/web-tech/blob/e14bfe760abbc37fa478aef80c9dcc2d8ad4ef31/docs/verification/security/2026-10-25-next-critical.md)
