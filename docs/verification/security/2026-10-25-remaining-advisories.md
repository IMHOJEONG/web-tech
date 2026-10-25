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

## 관련 문서

- [작업 기록](../../worklog/2026-10/2026-10-25-remaining-advisories.md)
- [기존 13건 추적](../../todo/todo.md)
- [Vite+ 보존 감사](../artifacts/2026-10-24-viteplus-override-audit.json)
- [PR #60 재검증 원본](https://github.com/IMHOJEONG/web-tech/blob/e14bfe760abbc37fa478aef80c9dcc2d8ad4ef31/docs/verification/security/2026-10-25-next-critical.md)
