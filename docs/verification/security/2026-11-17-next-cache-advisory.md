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
