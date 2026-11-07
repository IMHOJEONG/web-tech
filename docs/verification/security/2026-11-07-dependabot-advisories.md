# 11-07 Dependabot 신규 경고 보완 검증

## 대상과 조건

- 검증일: 2026-11-07 KST. 기준 main은 `932ee082c4bf63ad4676e065d0e091b96504974f`다.
- 범위: Dependabot #346~#356의 11건. Critical 1·High 1·Medium 6·Low 3이며 과거 KAN-35 경고와 다른 묶음이다.
- 작업 브랜치: `codex/security-dependabot-20261107`. 아래 검사는 최초 미커밋 로컬 변경으로 실행했다. 이후 사용자가 이번 코드·정제 문서의 작업별 커밋·푸시를 승인했으며 원격 CI·병합·배포 완료와는 구분한다.
- 환경: macOS arm64, Node 24.22.1·pnpm 12.14.0·TypeScript 6.0.3. 별도 작업 트리와 합성 데이터만 사용했다. 기존 미커밋 문서·stash·실제 NAS·DB·토큰은 변경하지 않았다.
- 추적: [KAN-64](https://web-tech-service.atlassian.net/browse/KAN-64), [Confluence 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=15990835). 원시 감사 응답·서버 로그·trace는 이 보고서에 복사하지 않았다.

## 조치와 공식 근거

| 대상                        | 경고·근거                                                                                                                                                                                                                                          | 기존 → 실제 잠금 버전 / 선택                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| better-auth·Drizzle adapter | #346·347·348·349: [Magic Link 계정 탈취](https://github.com/advisories/GHSA-965c-763c-88jm), [OAuth Proxy 계정 탈취](https://github.com/advisories/GHSA-r4xp-prcw-77qf), [동시 rate-limit 요청](https://github.com/advisories/GHSA-44jh-23m7-hpcf) | 1.7.0 → 미사용 직접 의존성·catalog·전이 경로 제거              |
| qs                          | #350: [comma 직렬화 DoS](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw)                                                                                                                                                                        | 6.16.0 → 6.17.1 / `>=6.16.1 <7`                                |
| @hono/node-server           | #352: [정적 파일 경로 이중 decoding](https://github.com/advisories/GHSA-rmxm-3fg6-px4f)                                                                                                                                                            | 1.19.17 → 2.1.6 / `^2.1.3`                                     |
| seroval                     | #353·354: [RegExp script 종료 문자열](https://github.com/advisories/GHSA-9wx9-5pv9-3349), [typed-array constructor 직렬화](https://github.com/advisories/GHSA-f86p-h4j2-7qgj)                                                                      | 1.6.8 → 1.7.7 / `^1.6.11`                                      |
| glob                        | #355: [취소 후 계속되는 파일 탐색](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)                                                                                                                                                              | 11.1.0 → 14.0.4 / `^14.0.2`                                    |
| minimatch                   | #356: [패턴 전처리 증폭](https://github.com/advisories/GHSA-g3hv-75wg-m249)                                                                                                                                                                        | 10.2.5 → 11.0.5 / `^11.0.1`                                    |
| deepmerge                   | #351: [GitHub advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)와 [공식 CVE 철회 기록](https://raw.githubusercontent.com/CVEProject/cvelistV5/main/cves/2026/93xxx/CVE-2026-93753.json)의 불일치                                        | 4.3.1 유지. 사용자 승인으로 #351만 `inaccurate` 처리 후 재조회 |

Better Auth는 docs manifest에만 선언되어 있었으며 앱·패키지 소스에 실제 import·플러그인·인증 경로가 없었다. 따라서 사용하지 않는 인증 계층을 패치해 계속 포함하는 대신 제거했다. 이 경고가 있었다는 사실만으로 운영에서 계정 탈취가 발생했다고 추정하지 않는다.

qs는 양쪽 Nest의 Express/body-parser 및 Supertest 경로, seroval은 TanStack router-core 경로다. Hono Node adapter는 Prisma CLI의 `@prisma/dev` 경로이며 Nest HTTP 서버를 Hono로 바꾸는 작업이 아니다. glob·minimatch는 Nest CLI·Jest·ESLint 등 개발 도구 경로를 함께 검사했다. 메이저 override의 안전성을 버전 숫자만으로 판단하지 않고 소비자 실행을 대조했다.

lockfile은 대상 버전 교체·필수 전이 의존성 변경과 미사용 인증 하위 그래프 제거를 포함한다. Next·Vite+·툴체인·기존 peer 예외·CI·배포 설정은 바꾸지 않았다. `path-scurry` 3.0.0과 `@isaacs/nonrecursive-glob-match` 1.1.0은 새 glob/minimatch 그래프에 따른 변화다.

### 철회된 deepmerge 경고

공식 CVE-2026-93753은 2026-11-02에 보안 취약점을 설명하지 않는다는 이유로 `REJECTED`가 됐다. 11-07 확인 시 npm 최신 deepmerge는 4.3.1이고 GitHub 감사 DB는 여전히 Low 경고를 반환했다. 실제 경로는 Nest CLI의 fork-ts-checker와 Jest 설정 도구이며 production 감사에는 나오지 않았다.

사용자가 승인한 #351 한 건에만 공식 근거를 기록하고 `dismissed/inaccurate` 상태를 재조회했다. 전체 audit가 반환하는 경고까지 사라진 것은 아니다. `auditConfig.ignore*`·가짜 안전 버전·임의 소스 패치를 추가하지 않았다. 향후 공식 상태가 바뀌면 다시 판단한다.

## 재현 방법

저장소 루트에서 프로젝트 mise 버전을 사용한다. `.env`나 운영 자격 증명을 복사할 필요가 없다. 설치 과정의 별도 agent skill 승인 요청은 이번 범위가 아니므로 승인하지 않았다.

```sh
mise exec -- pnpm install --frozen-lockfile --ignore-scripts
mise exec -- pnpm validate:catalog
mise exec -- pnpm --filter @web-tech/docs-content-contract build
mise exec -- pnpm --filter @web-tech/ui build
mise exec -- node --experimental-strip-types --test scripts/security-november-advisories.test.mts
mise exec -- pnpm exec tsc --noEmit --target ES2023 --module NodeNext --moduleResolution NodeNext --types node --allowImportingTsExtensions --erasableSyntaxOnly --skipLibCheck --strict scripts/security-november-advisories.test.mts scripts/security-fixtures/november-parsers.mts
mise exec -- pnpm test:repo
mise exec -- pnpm --filter docs-backend check
mise exec -- pnpm --filter vuln-radar-backend build
mise exec -- pnpm --filter vuln-radar-backend test --runInBand
mise exec -- pnpm --filter vuln-radar-backend lint
mise exec -- pnpm lint:web-apps
mise exec -- pnpm typecheck:web-apps
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter vuln-radar test:lib
mise exec -- pnpm --filter docs test:article:prod
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm audit --prod --json
mise exec -- pnpm audit --json
```

마지막 전체 감사 명령은 철회된 경고 1건 때문에 종료 코드 1을 반환한다.

production E2E는 3111·3112 포트를 비워 두고 실행한다. 기존 설정이 모든 원격 URL 후보를 합성 서버로 덮어쓰며 로컬에서 생성하는 fixture 자격 증명만 사용한다. 실제 NAS·운영 API·DB를 연결하지 않는다. HTTP 테스트에는 loopback listener 권한이 필요하다.

`@web-tech/ui`를 먼저 빌드하지 않은 최초 docs 라이브러리 검사는 `@web-tech/ui/lib/utils` 산출물 누락으로 시작하지 못했다. 공용 패키지를 빌드한 뒤 같은 검사로 재실행했으며 검사 기준·timeout·retry는 바꾸지 않았다.

## 결과와 증거

| 검사               | 결과                                                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 신규 보안 회귀     | 9/9 통과. 잠금 파일의 모든 사본·override 하한·미사용 인증 제거·양쪽 Express qs·Seroval 두 취약 경로·실제 Hono Node static adapter·minimatch 증폭·glob 취소 검사                                                                                                                        |
| 패치 전 동작 대조  | 이전 설치에서 RegExp 출력에 literal script 종료 문자열, minimatch의 128MiB 자식 프로세스 메모리 한도 초과, glob의 취소 후 추가 탐색을 관측. 초기 테스트의 Prisma 진입점 오해는 `prisma/package.json` 기준으로 바로잡았으며 취약점 증거와 구분                                          |
| 패치 후 동작       | Seroval은 자체 constructor 이름과 script 종료 문자열을 출력하지 않고 타입·정규식 내용을 유지. Hono는 보호 prefix 우회 요청을 거부하면서 정상 공개 파일은 반환. minimatch는 정해진 RangeError로 과도한 전처리를 거부. glob은 취소 뒤 추가 directory read 없이 거부하고 정상 탐색은 유지 |
| 도구·타입          | 저장소 236/236 통과(신규 9개 포함), 신규 TS strict·erasable 검사와 catalog 검사 통과                                                                                                                                                                                                   |
| docs-backend       | lint·typecheck·unit 73/73·HTTP 55/55·Nest 빌드 통과                                                                                                                                                                                                                                    |
| vuln-radar-backend | Prisma 생성·Nest 빌드·lint·unit 48/48 통과. 실제 DB 연결 검사는 아님                                                                                                                                                                                                                   |
| 웹 앱              | 두 앱 lint·typecheck 통과. docs 라이브러리 354/354, vuln-radar 라이브러리 32/32 통과                                                                                                                                                                                                   |
| 블로그 production  | 빌드와 모바일·데스크톱 E2E 198개 통과, 기존 opt-in 시각 검사 2개 skip. retry 0 유지                                                                                                                                                                                                    |
| vuln-radar 빌드    | 실패. 변경 전 main의 원래 잠금 파일을 설치한 별도 clean 작업 트리에서도 같은 `@/shared/i18n/i18n-provider` resolution 실패. 보안 수정만의 회귀로 확정할 수 없으며 빌드 성공으로 기록하지 않음                                                                                          |
| production audit   | 취약점 0건                                                                                                                                                                                                                                                                             |
| 전체 audit         | Low 1건만 잔여: 공식 철회된 deepmerge. Critical·High·Moderate 0건. 종료 1을 숨기거나 예외로 통과시키지 않음                                                                                                                                                                            |
| 원격 경고          | #351만 승인된 오탐 처리·재조회. 나머지 10건은 main 미병합으로 여전히 open                                                                                                                                                                                                              |

실제 검사는 [보안 회귀](../../../scripts/security-november-advisories.test.mts)와 [격리된 parser 재현](../../../scripts/security-fixtures/november-parsers.mts)에 있다. 증폭 검사는 상속 환경을 제한한 자식 프로세스에서 heap 128MiB·8초·출력 64KiB로 제한한다. 모든 파일 입력은 직접 만든 임시 fixture이며 직렬화한 공격 문자열을 실행하지 않는다. 원시 실행 로그를 공개 artifact로 추가하지 않았다.

### PR #88 원격 검사와 리뷰 확인

사용자 승인 후 [PR #88](https://github.com/IMHOJEONG/web-tech/pull/88)을 생성했다. base `932ee082`, head `42f4740`은 그대로이며 충돌이 없다. [CI 42362817794](https://github.com/IMHOJEONG/web-tech/actions/runs/42362817794)는 13개 job 모두 성공했고, 최종 check 23개도 SUCCESS다. CodeQL은 변경 코드의 신규 경고가 없다고 보고했다. 원시 CI 로그·trace는 공개 파일로 추가하지 않았다.

- production 본문 198 passed·기존 opt-in 2 skipped, 오프라인 62 passed, 공용 UI 68/16 passed를 확인했다.
- 태블릿은 123 passed·1 flaky·25 skipped다. `docs-index-order.spec.ts:83`의 정렬 링크 클릭이 element not visible로 최초 실패하고 재시도로 통과했다. 단일 원인은 미확정이며 안정화 완료로 표시하지 않는다. 검사 기준·timeout·retry는 변경하지 않았다.
- 문서 검사·linux/amd64 이미지 빌드·Vercel Preview 2건이 성공했다. PR 이미지 모드는 `push: false`이며 GHCR 게시·NAS 교체·Production 검증이 아니다.
- CodeRabbit은 head `42f4740` 검토를 완료했지만 보완 2건은 미해결이다. SUCCESS는 리뷰 실행 완료이며 지적 해소·병합 승인이 아니다. 잠금 파일은 기본 필터로 리뷰에서 제외돼 자체 그래프·감사 검사와 구분한다.

| 리뷰                                                                                                | 대조 결과와 남은 작업                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Major: coverage 소비자 호환](https://github.com/IMHOJEONG/web-tech/pull/88#discussion_r4501285186) | `mise exec -- pnpm --filter vuln-radar-backend test:cov --runInBand --no-cache`에서 test-exclude 6.0.0이 glob 모듈 객체를 promisify에 전달하는 TypeError를 재현했다. 13개 suite 실행 실패·tests 0이다. 일반 CI는 이 coverage 경로를 검사하지 않아 CI 통과와 모순되지 않는다. 보안 하한을 유지한 소비자 보완이 필요하며 main의 발생 여부·최초 도입 커밋은 미확정이다. |
| [Minor: 패키지명 오탐](https://github.com/IMHOJEONG/web-tech/pull/88#discussion_r4501285192)        | 현재 정규식은 합성 `better-auth-foo@1.0.0`도 제거 대상으로 매칭한다. 실제 better-auth 및 scoped adapter 검사는 유지하면서 완전한 이름 경계를 보완해야 한다.                                                                                                                                                                                                          |

CodeRabbit의 Docstring Coverage 권고는 Jest 실행 커버리지와 다른 검사다. 최초 확인에서는 source·의존성·검사 기준을 수정하거나 스레드를 해결 처리하지 않았다. 후속 사용자 요청에 따른 보완은 아래에 구분한다. 처음에는 로컬에만 기록했고, 이후 사용자가 이번 보완과 정제 문서 2개의 공개 검수·작업별 커밋·푸시를 승인했다. 원시 자료는 공개 범위에 포함하지 않는다.

### 미해결 리뷰 2건의 로컬 보완

공식 [test-exclude 구현](https://github.com/istanbuljs/test-exclude/blob/master/index.js)·[패키지 metadata](https://registry.npmjs.org/test-exclude/8.0.0)와 실제 설치본을 대조했다. 6.0.0은 glob 모듈 전체를 `promisify`에 전달하고 minimatch도 함수로 직접 호출한다. 8.0.0은 두 모듈의 named 함수를 사용하고 Node 20 또는 >=22를 지원해 프로젝트 Node 24와 호환된다. 설치한 8.0.0 소스에서도 같은 구현을 확인했다.

- `babel-plugin-istanbul@7.0.1>test-exclude: ^8.0.0`으로 확인한 소비 경로만 상향했다. glob 14.0.4·minimatch 11.0.5와 기존 보안 하한은 유지하며 lock의 패키지 교체는 test-exclude 6.0.0 → 8.0.0 한 개다. 전역 test-exclude override·임시 소스 패치·coverage provider 변경은 없다.
- 패키지명 matcher를 `better-auth@`와 `@better-auth/`로 구분했다. 실제 패키지 3개는 탐지하고 `better-auth-foo`·`better-authenticate`·다른 scope의 동명 패키지는 거부하는 양성/음성 대조를 추가했다.
- 각 백엔드가 실제로 설치한 Jest/Istanbul 경로로 새 프로세스를 실행한다. include/exclude·동기/비동기 glob·node_modules/외부 경로 제외, cache 없는 Babel 계측, 실제 coverage 파일의 경로·양수 hit·미실행 코드의 비어 있지 않은 0 hit를 검사한다. 종료 코드만으로 커버리지 성공을 판정하지 않는다.
- Jest 자체에 cache 비활성화·runInBand를 적용하며 합성 테스트만 임시 디렉터리에 만든다. 바깥 프로세스는 128MiB·30초, 안쪽 Jest는 512MiB·20초·출력 64KiB로 제한한다. 기존 증폭 입력의 8초 제한은 그대로다. 임시 파일과 보고서는 finally에서 정리하며 상속 runtime hook·자격 증명은 전달하지 않는다.
- 최초 새 회귀는 정규식 1개·양쪽 coverage 2개가 실패했고, 수정 후 보안 회귀는 12/12 통과했다. 새 fixture의 macOS 임시 경로 별칭 차이는 생성 직후 realpath로 정규화해 고쳤다. 파일 목록·hit 검사는 제거하지 않았다.
- 전체 저장소 239/239, 신규 소스 strict·erasable 타입, 양쪽 backend lint·catalog 검사 통과. 실제 cache 없는 coverage도 docs-backend 7 suite/73 tests, vuln-radar-backend 13 suite/48 tests가 통과했다. 이는 높은 coverage 비율을 보장하는 결과가 아니라 계측 경로 복구의 증거다.
- production audit 0건, 전체 audit는 이전과 같은 철회된 deepmerge Low 1건만 남는다. raw coverage JSON·실행 로그는 공개 검수 자료로 추가하지 않았다.

추가 재현 명령은 저장소 루트에서 실행한다. 두 번째 앱에는 `test:cov` script가 있고, docs-backend는 설치된 Jest를 직접 실행한다.

```sh
mise exec -- pnpm --filter vuln-radar-backend test:cov --runInBand --no-cache
mise exec -- pnpm --filter docs-backend exec jest --coverage --runInBand --no-cache
mise exec -- node --experimental-strip-types --test scripts/security-november-advisories.test.mts
mise exec -- pnpm test:repo
```

위 보완은 원격 `42f4740`과 구분한 로컬 검증 결과다. 사용자가 공개 검수 후 작업별 커밋·푸시와 새 head의 CI·재리뷰 확인을 승인했으며 최종 커밋·원격 결과는 연결된 KAN-64·Confluence 기록에 남긴다. 두 GitHub 스레드는 실제 반영·검증 후 처리한다. 태블릿 flaky와 Docstring Coverage 권고는 별도 과제이며 이번 보완으로 해결했다고 표시하지 않는다. main 병합·운영 배포는 이번 승인 범위가 아니다.

## 한계와 후속 작업

- 변경 전·후 Vite+ 빌드 실패의 단일 원인은 미확정이다. 해당 앱의 별도 빌드 경로 조사와 원격 CI에서 확인해야 한다. source 파일 누락이나 운영 장애로 단정하지 않는다.
- production 빌드에서 기존 글 2개의 placeholder 유사 문구 경고가 남았다. 보안 패치와 무관한 본문 편집은 섞지 않았다.
- 위 로컬 검사는 실제 운영 도달성·침해 여부·NAS amd64 이미지·Railway·Vercel 배포 검증을 대체하지 않는다.
- 사용자가 이번 코드·정제 문서의 공개 커밋·푸시를 승인해 목차를 포함한 문서 4개의 최종 bytes를 검수하고 해시를 기록한다. 기존 로컬 기록 2개·비공개 자료는 제외한다. 최종 커밋과 푸시 결과는 연결된 KAN-64 기록에서 확인하며 PR·원격 CI·main 병합·배포와 경고 자동 해소는 후속 단계다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-07-dependabot-advisories.md)
- [공개 검수 절차](../../process/publication-review.md)
- [과거 10-25 보안 검증](2026-10-25-remaining-advisories.md): 당시 결과이며 이번 11건의 증거로 대신하지 않는다.
