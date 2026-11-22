# Next.js root-param 캐시 권고 패치 검증

## 대상과 조건

- 검증일: 2026-11-17 KST. 기준 main `6b807f26fd878af38bdc144fdfe8f4af02585281`, 작업 브랜치 `codex/security-next-cache-20261117`의 미커밋 변경이다.
- 대상: Dependabot #362, [GHSA-mfr8-8qww-v76h / CVE-2026-119790](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h), Medium. Hono KAN-79와 다른 권고다.
- 환경: macOS arm64, Node 24.22.1·pnpm 12.14.0·TypeScript 6.0.3·Playwright 1.62.1. 별도 작업 트리에 `--ignore-scripts`로 설치했으며 별도 dotenv agent skill은 승인하지 않았다.
- 추적: [KAN-82](https://web-tech-service.atlassian.net/browse/KAN-82), [Confluence 진행 기록](https://web-tech-service.atlassian.net/wiki/pages/viewpage.action?pageId=65817&focusedCommentId=18513921).
- 아래 결과는 최초 미커밋 로컬 검증 기록이다. 이후 사용자가 작업 단위 커밋·푸시·main 반영용 PR 생성과 CI·CodeRabbit 확인을 요청했다. 후속 원격 SHA·검사·리뷰 결과는 연결된 Jira·Confluence와 PR에서 별도로 추적한다. 이번 요청에 main 병합·운영 배포는 포함하지 않으며 기존 Hono 사후 문서 4개·초안·stash·NAS·실제 DB·토큰은 유지한다.

## 권고와 조치

공식 영향 범위는 `>=16.3.0 <=16.4.4`, 최초 수정 버전은 **16.4.5**다. 현재 안정 채널의 [16.4.6 릴리스](https://github.com/vercel/next.js/releases/tag/v16.4.6)를 선택해 Next·MDX·env·SWC를 16.4.3에서 함께 갱신했다. docs catalog의 Next/MDX 하한은 `^16.4.6`, 미사용 web catalog의 Next 고정값은 `16.3.3 → 16.4.6`이다. 미사용 값 정리는 현재 노출 증명이 아니라 향후 재도입 방지다.

lockfile에서 실제 버전이 바뀐 계열은 Next·`@next/env`·`@next/mdx`·8개 플랫폼 SWC뿐이다. analytics·next-intl·toploader의 snapshot은 새 Next peer를 가리키도록 바뀌었으며 이 패키지 자체·React·MDX loader·다른 보안 override의 버전은 그대로다. ESLint major 전환은 포함하지 않았다.

취약 조건은 root params를 읽는 동일 `'use cache'` 함수를 렌더에서 직접 호출하는 동시에 `unstable_cache()`를 통해 호출하는 cold-fill 경쟁이다. root params가 없는 호출이 다른 값의 진행 중인 캐시 채우기에 합류하면, root-param 구분 없는 키에 결과가 저장될 수 있다. [공식 수정](https://github.com/vercel/next.js/commit/d605874e5a4b8b6b7dca1b6e07bcabb44d0e2e5b)은 관련 합류 경로에서 root params가 없으면 거절하도록 보완한다. 설치된 16.4.6의 두 보호 분기도 원본과 대조했다.

운영 [로컬 검색 캐시](../../../apps/docs/lib/local-search-cache.ts)는 `unstable_cache(loadLocalSearchIndex, ...)` 단독 사용이다. 운영 기본 설정은 Cache Components를 활성화하지 않으며 `'use cache'` 지시문은 실험 fixture에서만 찾았다. 이 소스 검사는 실제 운영 정보 유출의 재현이나 모든 간접 실행 경로의 안전성 증명이 아니다. 앱 캐시 정책과 route segment 설정은 변경하지 않았다.

프로젝트 공지는 11월 3일, 전역 GitHub 권고 DB의 `published_at`은 2026-11-17 03:51:22 KST다. 프로젝트 공개·전역 DB 등록·로컬 감사 관측 시점을 구분한다. 이번 Hono 병합으로 새 취약점이 생겼다는 뜻이 아니다.

## 재현 방법

저장소 루트에서 Node 24를 PATH로 선택하고 Corepack pnpm으로 실행했다. `.env`를 복사하지 않았다. production 본문 검사는 3111·3112의 합성 서버와 fixture 인증만 사용하고, 캐시 검사는 환경을 제한한 임시 복사본·로컬 origin을 사용한다. HTTP·Chromium 실행에는 로컬 listener·프로세스 실행 권한이 필요하다.

```sh
corepack pnpm install --lockfile-only --ignore-scripts
corepack pnpm install --frozen-lockfile --ignore-scripts
corepack pnpm --filter @web-tech/ui build
node --experimental-strip-types --test scripts/security-next-critical.test.mts
corepack pnpm exec tsc --noEmit --target ES2023 --module NodeNext --moduleResolution NodeNext --types node --allowImportingTsExtensions --erasableSyntaxOnly --skipLibCheck --strict scripts/security-next-critical.test.mts
corepack pnpm test:repo
corepack pnpm --filter docs lint
corepack pnpm --filter docs test:lib
corepack pnpm --filter docs test:article:prod
corepack pnpm --filter docs typecheck
corepack pnpm --filter docs test:cache:prod --search-index
corepack pnpm validate:catalog
corepack pnpm audit --json
corepack pnpm audit --prod --json
```

동일한 강화 테스트를 변경 전 Next 16.4.3을 설치한 별도 기준 작업 트리에 적용했다. 아래 경로는 실제 기준 트리의 절대 경로로 바꾼다. 기대 종료 코드는 1이며 수정본의 실패로 집계하지 않는다. 기준 트리의 소스와 Hono 사후 문서는 수정하지 않았다.

```sh
NEXT_SECURITY_WORKSPACE=/path/to/baseline node --experimental-strip-types --test scripts/security-next-critical.test.mts
```

## 결과와 증거

| 검사                  | 관측 결과                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 보안 게이트           | 수정 후 6/6 통과. 설치 Next/MDX/env 일치·Node 호환, 모든 Next catalog·잠금 사본의 `>=16.4.5 <17` 하한, 취약·prerelease 거절, 기존 이미지·Flight typed-array 동작 유지 |
| 구버전 대조           | 4/6 통과·2개 assertion 실패. 16.4.3 설치와 이전 catalog가 새 하한을 통과하지 못함. 캐시 정보 유출 자체를 재현했다는 뜻은 아님                                         |
| 저장소 검사           | 262/262 통과. 기존 보안 테스트를 강화했으므로 총 개수는 그대로이며 기존 CI의 `test:repo`에 포함됨                                                                     |
| docs lib·도구         | lib 370/370, lint·typecheck·신규 테스트 strict/erasable·catalog 11개 manifest 통과                                                                                    |
| production 본문       | 실제 기본 설정의 Next 16.4.6 빌드·모바일/데스크톱 E2E 198개 통과. 기존 비공개 opt-in 시각 관측 2개 skip, retry 0 유지                                                 |
| 운영 검색 캐시        | `--search-index` 통과. cold read·재사용·인증된 웹훅 갱신, expire:0·max·백그라운드 갱신, draft 제외·비게시/삭제, 원격 장애 중 로컬 유지, 파싱 실패 미캐시 확인         |
| 전체 audit            | 변경 전 Next Medium 1건·종료 1 → 수정 후 0건·종료 0. 검사 완료 시점 재조회에서도 0건                                                                                  |
| production audit      | 수정 후 0건·종료 0. 알려진 권고가 반환되지 않는다는 의미이며 무위험 보장은 아님                                                                                       |
| Cache Components 실험 | 패치 전 16.4.3·후 16.4.6에서 모두 `--locale-cache-key` 빌드 실패. 아래의 기존 설정 충돌과 초기 대조 준비 실패를 구분                                                  |

### 실험 실패와 준비 조건

미채택 Cache Components 실험은 전체 앱 복사본에서 이를 켜기 때문에, push·OG route의 `runtime = 'nodejs'`와 sitemap의 `revalidate = 300`이 실험 설정과 충돌한다. 16.4.6에서 실패했고, 기준 트리에 공용 패키지 산출물을 준비한 후 16.4.3에서도 같은 5개 route/config 진단으로 실패했다. 운영 기본 설정의 production 빌드 성공과 모순되지 않는다. 보안 업데이트만의 회귀로 단정하거나 실험 성공으로 표시하지 않았으며, 이를 통과시키려고 운영 route 설정을 제거하지 않았다.

기준 트리의 첫 실험 대조와 단독 스타일 검사에서는 UI·콘텐츠 계약의 `dist` 누락으로 먼저 실패했다. `@web-tech/ui`·`@web-tech/docs-content-contract`를 빌드한 뒤 같은 명령으로 대조했다. 수정 전후에 같은 콘텐츠 스타일 경고 2개도 확인했다. Brotli·TCP 공개 글의 placeholder-like 경고이며 이번 패치에서 글을 수정하거나 검사 기준을 완화하지 않았다.

실행 증거는 [강화된 보안 게이트](../../../scripts/security-next-critical.test.mts), [production 본문 설정](../../../apps/docs/playwright.article.config.ts), [기존 캐시 검증기](../../../apps/docs/scripts/test-content-cache-prod.mjs)와 그 합성 fixture다. 원시 로그·실제 운영 응답·캡처·인증 헤더·개인 실험 경로는 공개 artifact로 추가하지 않았다.

## SecurityFatalError 발생 경로 후속 확인

2026-11-17, 기존 PR #96 head `caa923f260cc15f29c6a9762829999354740d160`에서 별도 `codex/security-next-nudge-verification-20261117` 브랜치를 만들었다. 다음 결과는 위 최초 패치 검증과 다른 로컬 재검증이다. PR 원본과 콘텐츠 전환 미커밋은 수정하지 않았다.

### 어떤 공지 때문에 종료됐는가

Next 16.4.3만 공식 npm bulk endpoint에 조회했을 때 `GHSA-mfr8-8qww-v76h` 한 건이 반환됐다. 영향 범위는 `>=16.3.0 <=16.4.4`이며 설치 버전이 포함된다. 원래 빌드 로그는 개별 GHSA 대신 bulk endpoint URL만 표시하므로 현재 공식 응답·버전 범위·설치된 CLI 판정을 함께 대조했다.

설치된 [업그레이드 판정 코드](https://github.com/vercel/next.js/blob/v16.4.3/packages/next/src/lib/upgrade/prepare-upgrade.ts)는 npm 공지의 범위로 `affected`를 판단한다. [안내 코드](https://github.com/vercel/next.js/blob/v16.4.3/packages/next/src/lib/upgrade/nudge.ts)는 보안 권고를 agent에 전달할 때 `SecurityFatalError`, 종료 코드 1을 만든다. 컴파일·페이지 생성이 끝난 뒤라도 전체 명령은 실패할 수 있다.

```text
설치 Next 16.4.3
  -> npm 공지 범위에 포함
  -> affected=true, 안전한 대상 16.4.6
  -> agent용 보안 업그레이드 안내
  -> SecurityFatalError / exit 1
```

이 오류는 의존성 버전의 보안 권고이지, 실행 중인 블로그에서 정보 유출을 탐지했다는 뜻은 아니다. 취약 버전이므로 패치하되 실제 노출 조건과 분리한다.

### 블로그의 사용 조건

블로그의 `shared/message/request.ts`는 `next/root-params`의 locale을 읽는다. 따라서 root params 자체를 쓰지 않는다고 설명하면 틀리다. 다만 운영 검색 캐시의 `unstable_cache()`는 파일 기반 `loadLocalSearchIndex()`만 감싸며, 이 로더는 root-param 함수를 호출하지 않는다. 운영 경로에서 동일한 root-param 의존 `'use cache'` 함수를 직접·중첩 호출하는 조합은 확인하지 못했다. `'use cache'`와 Cache Components 활성화는 별도 실험 fixture에 있다.

실제 악용·개인정보 유출·cold-fill 공격 재현은 확인하지 않았다. 현재 소스의 필요 조건을 찾지 못했다는 관측은 향후 코드나 모든 라이브러리의 안전성을 보증하지 않는다.

### 판정·패치 후 재검증

Next가 실제 사용하는 `getUpgradeAssessment()`를 각 설치 버전에서 공식 registry에 연결해 실행했다.

| 설치 버전 | affected | upgrade.status | targetVersion |
| --------- | -------- | -------------- | ------------- |
| 16.4.3    | true     | ready          | 16.4.6        |
| 16.4.6    | false    | unaffected     | 없음          |

추가한 [판정 회귀](../../../scripts/security-next-upgrade-assessment.test.mts)는 동일한 설치 CLI에 합성 registry 응답을 주입한다. 구버전 거절·안전한 대상 선택, 수정 버전의 unaffected, 연결 실패·잘못된 범위의 unknown을 검사한다. 조회 실패를 안전하다고 처리하지 않으며 네트워크 없는 검사를 실제 registry 조회나 취약점 악용 재현과 혼동하지 않는다. 기존 root test glob이 이 파일을 실행하므로 CI 설정을 바꾸지 않았다.

```sh
node --test scripts/security-next-critical.test.mts scripts/security-next-upgrade-assessment.test.mts
pnpm test:repo
pnpm --filter docs test:lib
pnpm --filter docs test:cache:prod --search-index
pnpm --filter docs lint
pnpm --filter docs build
pnpm audit --prod --json
```

| 후속 검사            | 결과                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 보안 하한·공지 판정  | 기존 6개·새 판정 4개 모두 통과. 취약 버전/조회를 못 한 상태와 안전한 버전을 구분한다.                                                                                   |
| 저장소·앱 라이브러리 | 저장소 266개, docs lib 370개 통과. 새 판정 4개는 저장소 개수에 포함되므로 중복 합산하지 않는다.                                                                         |
| 표준 production 빌드 | `pnpm --filter docs build` exit 0. SecurityFatalError 없이 컴파일·타입 검사·정적 생성 완료.                                                                             |
| 실제 production 캐시 | 기존 검색 인덱스·본문·권한 없는 웹훅 거절·승인 후 V2·비공개 초안 제외·게시 해제/삭제·원격 장애/복구·파싱 실패 비캐시 검사 통과. 격리 합성 origin이며 실제 NAS가 아니다. |
| 추가 테스트 타입     | TypeScript strict·erasableSyntaxOnly 통과. 최초 mock 인자 타입 누락 4건을 명시적 fetch 인자 타입으로 고친 뒤 재검사했다.                                                |
| lint·감사            | 앱 lint 통과. production 감사는 817개 의존성 집계에서 모든 severity 0건·exit 0.                                                                                         |

보안 policy 비활성화·audit 예외·`node_modules` 수정·환경 변수 우회는 하지 않았다. 빌드 결과의 `experimental.agentUpgrade=security`를 대조했다. 기존 placeholder-like 콘텐츠 경고 2개는 유지했으며 글이나 경고 기준을 수정하지 않았다.

이번 후속 범위에서 브라우저 전체 E2E를 다시 실행한 것은 아니다. PR #96 원격 head `caa923f2`의 23개 체크와 두 Preview 성공을 별도로 재조회했다. 이 기존 원격 성공은 아직 미커밋인 추가 테스트·문서의 CI 성공을 뜻하지 않는다. 이번 추가 파일의 공개 검수·커밋·푸시·main 병합·운영 배포는 실행하지 않았다.

기존 콘텐츠 전환 트리는 의도적으로 16.4.3과 미커밋 변경을 보존했다. 수정본의 빌드 통과가 원본 트리·main·운영에 패치를 적용했다는 의미는 아니다. 해당 트리의 재빌드 성공은 보안 패치 전파 후 별도 통합 검증이 필요하다.

## 한계와 후속 작업

- 실제 취약 cold-fill 동시성 공격은 재현하지 않았다. 보안 하한 검사·공식 수정 분기 대조·기존 기능 회귀를 실제 공격 차단 실험과 혼동하지 않는다.
- Cache Components 전면 채택은 별도 마이그레이션·실험 과제다. 이번에는 운영 기본 캐시 모델을 유지한다.
- 최초 로컬 검증만으로 원격 Dependabot #362 해소를 선언하지 않는다. 후속 요청에 따라 최종 파일 공개 검수·커밋·PR의 CI·리뷰를 확인하며, 별도 main 반영 후 GitHub 재평가와 운영 검증이 필요하다.
- 과거 Hono 보고서의 별도 deepmerge Low는 이번 전후 감사에서 반환되지 않았다. 이번 패치가 deepmerge를 수정했거나 과거 관측이 틀렸다는 의미는 아니며 dismiss·ignore는 추가하지 않았다.
- 기존 Hono 사후 문서 4개·초안·stash·NAS 작업과 다른 개발 서버는 보존했다. 임의 승인 해시·커밋·운영 설정 변경은 하지 않았다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-17-next-cache-advisory.md)
- [공개 검수 절차](../../process/publication-review.md)
- [브랜치 정책](../../process/branch-policy.md)
- [공식 16.4.5 보안 릴리스](https://github.com/vercel/next.js/releases/tag/v16.4.5)

## PR #96 main 병합과 운영 확인

2026-11-17 KST 사용자 승인 후 같은 head `caa923f260cc15f29c6a9762829999354740d160`을 최종 메시지 전체와 상태 사전검사로 검증했다. 검사 전용·병합 단계의 메시지 SHA-256은 모두 `1c1d9a8191db098ee418409d33e0d30f1dd4970d87592ec15d2a299981267335`이며 예외는 없었다. 최초 실행은 PATH에서 gh를 찾지 못해 병합 전에 실패했고, 실행 경로만 바로잡아 같은 검사를 다시 통과했다. GitHub 보호·검사 규칙은 변경하지 않았다.

[PR #96](https://github.com/IMHOJEONG/web-tech/pull/96)은 MERGED이며 병합 SHA는 [a7e095c5adf3eee214e741ed259a048a78ffe712](https://github.com/IMHOJEONG/web-tech/commit/a7e095c5adf3eee214e741ed259a048a78ffe712)다.

| 병합 후 확인          | 결과                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| main CI               | [44098448574](https://github.com/IMHOJEONG/web-tech/actions/runs/44098448574), 동일 SHA의 13개 job 전부 성공.                                                |
| 문서·이미지·보안 검사 | Documentation 44098448469·Docs Backend Image 44098448510·Push on main 44098448117 성공. actions·JavaScript CodeQL 체크도 성공.                               |
| 블로그 Production     | GitHub 배포 7855464552, 동일 SHA·success. 공개 홈·문서 목록·검색 API GET 200.                                                                                |
| 다른 자동 배포        | vuln-radar Production 7855477964, 동일 SHA·success. 실제 DB·운영 API를 변경하거나 별도 기능 점검을 수행한 것은 아니다.                                       |
| Dependabot #362       | state=fixed. GitHub fixed_at 2026-11-17T14:00:39Z이며 수동 dismiss는 하지 않았다.                                                                            |
| 콘텐츠 전환과 통합    | 원본 전환 변경을 보존해 새 main을 반영한 뒤 Next 16.4.6에서 표준 빌드·private-git 출력 빌드 모두 exit 0. 원격 콘텐츠 저장소·NAS·자격 증명은 변경하지 않았다. |

이 브랜치의 추가 판정 회귀 4개와 조사 문서 보완은 여전히 로컬 미커밋이다. 이미 병합된 PR #96의 보안 패치와 동일시하지 않는다. 기존 stash 10개와 독립 작업 트리를 보존했고, 보안 검사 해제·임의 승인 해시 갱신·후속 코드 푸시는 하지 않았다.
