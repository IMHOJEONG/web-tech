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

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-25-remaining-advisories.md)
- [기존 13건 추적](../../todo/todo.md)
- [Vite+ 보존 감사](../artifacts/2026-10-24-viteplus-override-audit.json)
- [PR #60 재검증 원본](https://github.com/IMHOJEONG/web-tech/blob/e14bfe760abbc37fa478aef80c9dcc2d8ad4ef31/docs/verification/security/2026-10-25-next-critical.md)
