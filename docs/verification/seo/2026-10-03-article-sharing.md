# 문서 구조화 데이터와 OG 이미지 검증

## 대상과 조건

- 검증일: 2026-10-03, Asia/Seoul.
- 대상: `feature/docs`, 기준 HEAD `d77a041`과 미커밋 작업 트리. 웹 푸시 작업도 진행 중인 환경이다.
- 환경: Node v24.12.0, Next.js 16.3.4, Chromium, 로컬 콘텐츠 fixture와 프로덕션 서버.
- 모바일은 390×844 에뮬레이션, 데스크톱은 1280×800이다. NAS/Vercel 배포 결과는 아니다.

## 재현 방법

저장소 루트에서 단위 검사와 전체 회귀를 실행한다.

```bash
mise exec -- node --experimental-strip-types --test \
  apps/docs/lib/article-metadata.test.ts apps/docs/lib/article-sharing.test.ts
mise exec -- pnpm --filter docs test:article:prod
```

이번 실행은 `test:article:prod -- article-detail.spec.ts article-sharing.spec.ts`였지만 실제 출력은 전체 82개 실행이었다. 두 파일만 선택하려면 앱 디렉터리에서 Playwright를 직접 실행한다.

```bash
cd apps/docs
mise exec -- pnpm exec playwright test --config=playwright.article.config.ts \
  article-detail.spec.ts article-sharing.spec.ts
mise exec -- pnpm exec tsc --noEmit
mise exec -- pnpm exec tsc -p tsconfig.node-test.json
```

설정이 콘텐츠 fixture(3112)와 프로덕션 서버(3111)를 실행하고 종료하므로 해당 포트가 비어 있어야 한다. fixture 인증값은 테스트 전용이다.

## 결과와 증거

실행 출력에서 추출한 [결과 요약](../artifacts/2026-10-03-article-sharing.json)을 보관했다.

| 검사                             | 결과                        |
| -------------------------------- | --------------------------- |
| 메타데이터·공유 함수 단위 테스트 | 7개 통과                    |
| 프로덕션 build                   | E2E 서버 시작 과정에서 통과 |
| 전체 Playwright 회귀             | 82개 통과, 출력 기준 1.2분  |
| 변경 코드 lint                   | 오류·경고 없이 통과         |
| 앱·Node 테스트 타입 검사         | 모두 통과                   |

상세 검사 16개는 한국어·영어의 로컬 MDX, category 문서, 원격 HTML, 없는 문서를 모바일·데스크톱에서 확인한다. 정상 문서의 BlogPosting 하나, 제목·canonical·현재 URL 일치, 제목을 포함한 OG URL을 처음 접근과 reload에서 검사한다. 없는 문서에는 BlogPosting이 없다.

이미지 검사 2개는 각 프로젝트에서 한글·긴 제목·빈 제목의 PNG를 요청한다. 총 6개 응답에서 HTTP 200, image/png, PNG 서명, 1200×630 크기, 공유 캐시 헤더와 nosniff를 확인했다. 한글과 긴 제목의 시각 배치는 앞선 로컬 이미지 확인도 수행했다.

## 한계와 후속 작업

- PNG 검사는 모든 글자의 시각 배치를 자동 판독하지 않으며 실제 iPhone/Safari 검증도 아니다.
- 발행 테스트 중 기존 `The destination stream closed early` 서버 로그가 8회 관측됐다. 전체 테스트 통과가 서버 로그 부재를 뜻하지 않으며 이 SEO 검사로 각 로그의 요청 원인을 새로 확정하지 않는다.
- 이전 `push-api.ts` 타입 오류는 현재 작업 트리에서 해결됐고 이번 전체 build는 통과했다. 당시 실패 기록은 worklog에 보존한다.
- Vercel 실제 이미지 응답, Google Rich Results Test와 공유 서비스 캐시는 배포 후 확인한다. 검색 순위나 노출 형식을 보장하지 않는다.

## 관련 문서

- [Metadata 정책](../../architecture/docs-article-metadata-policy.md)
- [SEO 확인 절차](../../runbooks/docs-seo-metadata-routes.md)
- [구현 기록](../../worklog/2026-10/2026-10-03-article-structured-data-og.md)
