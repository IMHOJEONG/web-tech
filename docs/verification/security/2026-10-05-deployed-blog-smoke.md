# 보안 패치 전달 후 운영 블로그 점검

## 대상과 조건

- 검증일: 2026-10-05, KST. 기본 기능 검사 완료 시각은 17:50:47이며 이후 정상 카테고리와 Runtime Logs를 추가 확인했다.
- 대상: `feature/docs` 커밋 `ee1f694e9deea575638a9738de671c4351988b71`, 공개 운영 주소 `https://heap-forge.app`.
- [CI](https://github.com/IMHOJEONG/web-tech/actions/runs/37280654190)와 [Documentation](https://github.com/IMHOJEONG/web-tech/actions/runs/37280654497)은 success다. GitHub Vercel 상태의 배포와 `vercel inspect heap-forge.app`의 배포가 일치하며 Production READY 및 도메인 alias를 확인했다.
- 도구: Node.js 24.12.0, 설치된 Chrome 154.0.8037.95를 Playwright로 headless 실행. 데스크톱 1280×800, 모바일 390×844 viewport다. 인앱 브라우저와 로컬 fixture 서버는 사용하지 않았다.
- 초기 기능 검사는 GET 요청과 브라우저 이동만 수행했다. 후속 origin 비교에서 `vercel curl`이 프로젝트의 deployment protection bypass token을 자동 생성했다. 보호 설정 자체를 끄지 않았으며 토큰 값·인증 헤더·쿠키는 보고서와 artifact에 저장하지 않았다. NAS 파일·환경 변수·WAF·캐시 설정을 수정하거나 revalidation POST를 호출하지 않았다.

## 재현 방법

저장소 루트에서 실행한 배포·로그 확인 명령:

```sh
gh run list --branch feature/docs \
  --commit ee1f694e9deea575638a9738de671c4351988b71 --limit 10
gh api repos/IMHOJEONG/web-tech/commits/ee1f694e9deea575638a9738de671c4351988b71/status
vercel inspect heap-forge.app --scope hojeong-ims-projects --format=json
vercel logs --project web-tech --scope hojeong-ims-projects \
  --deployment web-tech-attbleol8-hojeong-ims-projects.vercel.app \
  --environment production --since 20m --query 'web/browser' \
  --json --limit 10 --no-follow
vercel logs --project web-tech --scope hojeong-ims-projects \
  --deployment web-tech-attbleol8-hojeong-ims-projects.vercel.app \
  --environment production --since 20m \
  --query 'javascript-event-loop-runtime' --json --limit 5 --no-follow
```

브라우저 검증은 아래 임시 verifier로 실행했다. 이 파일은 이 머신에만 있으며 저장소의 지속적인 CI 테스트로 추가하지 않았다.

```sh
mise exec -- node /private/tmp/heap-forge-production-smoke.cjs
mise exec -- node /private/tmp/heap-forge-category-live.cjs
```

다시 점검하려면 Chrome에서 `/ko/docs`의 페이지 1·2, 헤더·본문 검색에 `  React  ` 제출, 0건에서 전체 목록 복귀, 아래 표의 상세·카테고리를 확인한다. OG는 다음 명령으로 본문까지 받고 PNG signature와 IHDR의 1200×630 크기를 확인한다. HEAD 응답만으로 이미지 생성 성공을 판단하지 않는다.

```sh
curl -sS -D - -o /tmp/heap-forge-og.png \
  'https://heap-forge.app/og/article.png?title=HEAP-FORGE&topic=WEB'
curl -sS -D - -o /dev/null \
  'https://heap-forge.app/ko/category/fe/node-js'
```

## 결과와 증거

[요청 식별자를 제외한 관측 JSON](../artifacts/2026-10-05-deployed-blog-smoke.json)에 초회 실패와 재검증 결과를 보관한다.

| 검사               | 최종 결과                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| 목록·페이지 이동   | 양쪽 viewport에서 1페이지 8개·2페이지 3개. href 및 페이지 간 중복 없음                                      |
| 헤더·본문 검색     | `React`로 정규화, 3개 표시, 전체 document reload 없이 이동                                                  |
| 0건 검색·복구      | 검색 결과 없음 제목과 전체 목록으로 복귀 확인                                                               |
| 로컬 상세          | `/ko/docs/web/javascript-event-loop-runtime`의 본문·말미·보충 영역·canonical·구조화 데이터·OG metadata 확인 |
| 원격 상세          | `/ko/docs/web/browser`의 본문 3,714자·말미·보충 영역·canonical·구조화 데이터·OG metadata 확인               |
| 잘못된 카테고리    | `unknown`·`fe/node-js`·짧은 `{react,browser}` 표본 거부. 오류 화면·noindex 있음, 본문 없음                  |
| 정상 카테고리      | `ko/category/fe`·`ko/category/fe/react`·`en/category/be/node-js`가 HTTP 200·최종 H1 1개·noindex 없음        |
| legacy 상세        | React 상세가 canonical `/ko/docs/category/...`로 이동하고 본문 표시                                         |
| 영어 검색·공개 API | 영어 React 검색 화면, API 3개·href 유일성 확인                                                              |
| OG PNG             | 한국어·긴 제목·빈 제목 3개 모두 HTTP 200, PNG signature·1200×630·nosniff 확인                               |
| 레이아웃·오류      | 대상 화면의 document 가로 넘침 없음. 브라우저 pageerror 및 console warning/error 0개                        |

최종 기능 검사는26개와 정상 카테고리6개의 합계 **32개 통과**다. 아래 본문 구조·번역·캐시 계약 과제까지 해결됐다는 의미는 아니다.

초회 기본 검사는 21개 통과·5개 실패였다. 원격 상세 2개는 `main h1`이 2개에 일치해 본문 검증에 진입하지 못했다. H1 중복을 기록하고 본문·말미·metadata를 별도로 재검증했다. OG 3개는 로컬과 동일한 `s-maxage=86400`을 기대해 실패했다. 후속 조사에서 이 기대값은 Vercel의 헤더 소비 동작을 고려하지 않은 것으로 확인했다. 원본 실패 결과는 보존하며, 실제 미해결 항목은 아래의 브라우저 TTL 차이다.

정상 카테고리 초회는5개 통과·1개 실패였다. 모바일 영어 카테고리에서 이동 직후 같은 H1이2개에 일치했다. 최종 DOM의 H1이1개가 되는 것을 기다린 재검증에서는6개 통과했다. 초회 중복의 상세 원인은 미확정이며, 원격 본문에 지속적으로 존재하는 서로 다른 H1 2개와 구분한다.

### Runtime Logs

- 로컬 상세: `source: local`, `includeRemote: true`. 원격 확인 success55.30ms, 선택62.08ms, 본문 렌더링178.58ms 표본이다. 원격에 일치하는 글이 없는 경우도 reason이 `remote-detail-unavailable-local-fallback`이므로 이 문구만으로 API 장애를 단정하지 않는다.
- 원격 상세: `source: remote`, `remote-detail-found`. 원격 확인77.24ms, 선택118.55ms, 본문 렌더링1.38ms 표본이다.
- 목록: `source: mixed`, 로컬10개·원격1개·합계11개.
- 해당 배포의 `--since 15m --level error --limit 20` 조회 결과는0개였다. 제한된 시간대의 관측이며 전체 사용자·미래 요청의 성공을 보장하지 않는다.

### 세 가지 보완 항목의 후속 점검

#### 원격 글의 제목 계층

로컬 환경의 기존 인증 설정으로 `/posts/web/browser`를 조회했다. 응답은 HTTP 200, `text/html; charset=utf-8`, HTML 6,518자이며 H1은 `Browser 동작 원리`와 `Update!` 두 개였다. 공개 화면과 같은 제목이므로 중복은 API 응답에 이미 존재한다. 인증 값과 원문 전체는 출력하거나 저장하지 않았다.

- [HTML 정규화](../../../apps/docs/widgets/article-detail/model/normalize-remote-article-html.ts)는 입력 heading의 깊이를 유지하고 ID·TOC를 추가한다.
- [본문 렌더러](../../../apps/docs/lib/render-article-content.ts)는 H1 존재 여부만 확인한다. H1이 있으면 상세 레이아웃의 fallback 제목을 추가하지 않는다. 이번 중복을 프론트의 제목 추가 문제로 볼 근거는 없다.
- [공용 본문 검증기](../../../packages/docs-content-contract/src/body-style.ts)는 Markdown 본문의 `#` 제목을 실패로 처리한다. [현재 NestJS 구현](../../../apps/docs-backend/src/modules/content/content.service.ts)은 실패한 문서를 목록에서 제외하고 상세에서 404로 처리한다.

따라서 NAS 원문과 실행 이미지 버전을 함께 확인해야 한다. 원문을 가져오거나 NAS 이미지 digest를 확인한 것은 아니므로 구버전 실행을 확정하지 않는다. 기존 본문을 검증하지 않고 새 이미지만 배포하면 해당 글이 제외될 위험이 있다. 원문 복사본에서 frontmatter 제목과 `##`/`###` 절 제목을 정리하고 검증한 뒤 배포·revalidation을 수행한다. 임의로 모든 H1을 H2로 바꾸는 프론트 보정은 이번에 적용하지 않았다.

기존 제목 감지·HTML 변환 테스트를 다음과 같이 실행해 **17개 통과**를 확인했다. 이 테스트 통과는 운영 글의 제목 계층이 올바르다는 의미가 아니다.

```sh
cd apps/docs
mise exec -- node --experimental-strip-types --test lib/render-article-content.test.ts
```

#### 카테고리 번역 범위

운영 영어 화면의 한국어 H1은 [하위 주제 페이지](../../../apps/docs/app/[locale]/category/[main]/[sub]/page.tsx)에 하드코딩되어 있다. 같은 문제가 [전체 카테고리](../../../apps/docs/app/[locale]/category/page.tsx), [상위 카테고리](../../../apps/docs/app/[locale]/category/[main]/page.tsx), [주제 설명 데이터](../../../apps/docs/entities/category/model/category.ts)에도 있다. H1만 번역하면 안내·문서 수·최근 업데이트·주제 설명은 남는다.

metadata는 이미 `getTranslations`를 사용하지만 화면 문구는 별도다. UI 문구와 주제 설명을 ko/en 번역 키로 옮기되 카테고리 URL·허용 목록은 유지해야 한다. 실제 문서의 제목·요약까지 자동 번역하는 작업과는 구분한다. 운영 문서 자체가 한국어일 수 있으므로 영어 화면 전체에 한글이 없다는 조건으로 테스트하면 안 된다.

#### OG 캐시 응답 경계

같은 `/og/article.png?title=HEAP-FORGE&topic=WEB`을 두 경로로 조회했다. redirect를 따라 공개 도메인을 origin으로 오인하지 않도록 immutable Vercel deployment를 인증해 비교했다.

| 경로                   | HTTP | 관측 Cache-Control      | 서버·캐시 표본                                                        |
| ---------------------- | ---- | ----------------------- | --------------------------------------------------------------------- |
| Vercel deployment 직접 | 200  | `public, max-age=3600`  | `server: Vercel`, `x-vercel-cache: MISS`                              |
| 공개 도메인            | 200  | `public, max-age=14400` | `server: cloudflare`, `cf-cache-status: MISS`, `x-vercel-cache: MISS` |

[앱 지정 값](../../../apps/docs/app/og/article.png/route.tsx)은 `public, max-age=3600, s-maxage=86400`이다. `Cache-Control`만 설정하면 Vercel이 `s-maxage`를 소비하고 최종 응답에서 제거하므로 이 값이 안 보이는 것은 정상이다. [Vercel 공식 설명](https://vercel.com/docs/caching/cache-control-headers).

실제 차이는 브라우저 `max-age`가 Vercel 직접 응답에서는 1시간, Cloudflare를 거친 공개 응답에서는 4시간이라는 점이다. [Cloudflare Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/set-browser-ttl/)은 더 짧은 origin TTL을 덮어쓸 수 있으므로 우선 확인할 설정이다. 다만 zone 설정과 Cache Rules를 읽지 않았으므로 특정 규칙이 원인이라고 확정하지 않는다. 같은 URL의 이미지 갱신 시 브라우저가 최대 4시간 이전 이미지를 사용할 수 있다.

origin 재현 명령은 아래와 같다. `vercel curl`은 보호 우회 토큰을 자동 생성할 수 있으므로 프로젝트 관리 권한과 생성 영향을 확인하고 실행한다. 인증 헤더·Set-Cookie를 공유하지 않는다.

```sh
vercel curl '/og/article.png?title=HEAP-FORGE&topic=WEB' \
  --deployment https://web-tech-attbleol8-hojeong-ims-projects.vercel.app \
  --scope hojeong-ims-projects -- \
  --silent --show-error --max-time 30 --output /dev/null \
  --dump-header /tmp/heap-forge-origin-og-headers.txt
```

다음 확인은 Cloudflare Browser Cache TTL과 `/og/article.png`에 적용되는 Cache Rules다. 앱의 1시간 계약을 유지하려면 origin 헤더 존중 여부를 확인하고 공개 응답을 재검증한다. 이번에는 설정 변경·캐시 purge를 수행하지 않았다. `s-maxage`가 공개 헤더에 보이는지 여부만으로 CDN의 실제 1일 TTL까지 입증할 수는 없다.

## 한계와 후속 작업

1. 원격 Browser 본문에 `Browser 동작 원리`와 `Update!`가 모두 H1이다. 글 제목과 절 제목의 계층을 정리할 필요가 있다. 이번에는 NAS 원문을 변경하지 않았다.
2. `/en/category/be/node-js`에 `관련 문서를 한곳에서 살펴보세요.`라는 한국어 H1이 표시된다. 카테고리 페이지의 하드코딩된 문구를 번역으로 옮겨야 한다.
3. OG의 `s-maxage` 제거는 정상이다. 후속 인증 비교에서 Vercel 직접 응답의 `max-age=3600`과 공개 도메인의 `max-age=14400` 차이를 확인했다. Cloudflare Browser Cache TTL·Cache Rules의 실제 적용 값은 미확정이다.

잘못된 카테고리도 streaming HTTP 200일 수 있어 오류 화면·noindex로 판단했다. 짧은 입력만 보냈고 DoS·RCE 공격을 실행하지 않았다. 정상 OG 출력은 취약점의 완전한 도달 불가능성을 증명하지 않는다. `braces` high는 남아 있다.

검사한 두 상세의 본문 이미지는0개였으므로 NAS asset 배포 성공을 검증한 것은 아니다. 실제 기기·Safari·Firefox·OS IME·전체 라우트·원격 장애/복구·NAS 글 변경과 webhook·TTL 만료는 범위 밖이다. 브라우저 시나리오 전체 시간을 Vercel 단일 함수 실행시간과 동일시하지 않는다.

## 관련 문서

- [입력 경계의 구현 검증](2026-10-05-next-category-hardening.md)
- [feature 브랜치 동기화](../../worklog/2026-10/2026-10-05-feature-sync-after-security-pr.md)
- [이번 작업 기록](../../worklog/2026-10/2026-10-05-deployed-blog-smoke.md)
- [후속 TODO](../../todo/todo.md#dependency-security)
