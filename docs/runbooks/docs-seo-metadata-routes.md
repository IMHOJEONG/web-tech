# Docs SEO Metadata Routes

## 목적

`/robots.txt`와 `/sitemap.xml` 요청이 404로 떨어지면 검색엔진과 일반 크롤러가 사이트 구조를 추론하기 어려워진다. HeapForge docs 앱은 Next.js metadata route로 두 경로를 명시적으로 응답한다.

## 구현 위치

- `apps/docs/app/robots.ts`
- `apps/docs/app/sitemap.ts`
- `apps/docs/lib/seo.ts`

## 설정

`DOCS_SITE_URL`은 공개 canonical origin이다.

```env
DOCS_SITE_URL=https://heap-forge.app
```

이 값은 `robots.txt`의 `Host`, `Sitemap`과 `sitemap.xml`의 절대 URL 생성에 사용한다. 값이 없거나 잘못되면 기본값 `https://heap-forge.app`을 사용한다.

## metadataBase 정책

root layout의 `generateMetadata()`는 `metadataBase`를 `DOCS_SITE_URL` 기준으로 설정한다.

이유:

- Open Graph 이미지처럼 상대 경로로 선언된 metadata URL을 배포 도메인 기준 절대 URL로 해석하기 위함이다.
- Vercel preview, custom domain, 로컬 환경이 섞여도 canonical metadata 기준을 명확히 하기 위함이다.
- metadata base는 path가 아니라 origin 기준으로 사용한다.

예:

```env
DOCS_SITE_URL=https://heap-forge.app
```

이 설정이면 `/og-image.png`는 metadata에서 `https://heap-forge.app/og-image.png` 기준으로 해석된다.

## robots.txt 정책

- 모든 사용자 에이전트에 `/` 접근을 허용한다.
- 검색 결과나 앱 내부 구현 경로로 볼 수 있는 `/api/`, `/_next/`, `/open/`은 크롤링하지 않도록 안내한다.
- 보안 차단은 `robots.txt`가 아니라 `apps/docs/proxy.ts`의 request blocklist가 담당한다.

## sitemap.xml 정책

- 정적 라우트와 공개된 로컬·원격 문서의 canonical 라우트를 포함한다. 초안과 보관된 글은 제외한다.
- 검색 인덱스와 같은 콘텐츠 정책을 사용한다. 동일 URL은 원격 문서를 우선하고 한 번만 포함한다.
- `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`이면 원격 목록을 호출하지 않는다.
- 원격 API 미설정 또는 조회 실패 시 정적 라우트와 로컬 공개 문서로 응답한다.
  - 원격 목록 조회에는 기존 API timeout 설정(`BLOG_CONTENT_API_TIMEOUT_MS`, 기본 2500ms)과 클라이언트 재시도 정책이 적용된다. 전체 응답 시간이 timeout 값 이하임을 보장하지는 않는다.
  - 문서 본문은 가져오지 않고 목록 메타데이터만 사용한다.
- `lastModified`는 유효한 `updatedAt`을 우선하며, 없으면 `date`를 사용한다. 둘 다 유효하지 않으면 생략한다.
- 기존 한국어·영어 URL과 언어별 alternate 링크를 유지한다.
- 사이트맵은 300초 주기로 재검증한다. 장애 중 로컬 문서만 생성된 경우에도 이후 요청에서 원격 목록을 다시 시도할 수 있다.
  - 원격 목록 캐시는 `BLOG_CONTENT_REVALIDATE_SECONDS`(기본 300초)를 따른다. 발행 후 즉시 캐시를 무효화하려면 기존 `/api/revalidate/content` 운영 절차를 사용한다.

## 확인 명령

```bash
curl -I https://heap-forge.app/robots.txt
curl -I https://heap-forge.app/sitemap.xml
curl https://heap-forge.app/robots.txt
curl https://heap-forge.app/sitemap.xml
```

## 문서 구조화 데이터와 공유 이미지 확인

저장소 루트에서 Node 24로 실행한다. 로컬 검증은 NAS를 끄고도 할 수 있다.

```bash
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false mise exec -- pnpm --filter docs dev
```

다른 터미널에서 공개 상세와 이미지 응답을 확인한다. 아래 이미지 경로는 locale 없이 접근하며 `/api/`의 robots 차단 대상에 포함되지 않는다.

```bash
curl -fsS http://127.0.0.1:3001/ko/docs/web/javascript-event-loop-runtime
curl -fG http://127.0.0.1:3001/og/article.png \
  --data-urlencode 'title=첫 화면은 어디에서 늦어지는가' \
  --data-urlencode 'topic=BROWSER PERFORMANCE' \
  --data-urlencode 'author=HoJeong Im' -o /tmp/article-og.png
```

기대 결과는 다음과 같다.

- 상세 HTML에 `BlogPosting` JSON-LD가 하나 있으며 `url`이 해당 locale의 canonical과 같다.
- OG/Twitter 이미지가 `/og/article.png`의 절대 URL을 가리킨다.
- 이미지 응답은 HTTP 200, `image/png`, 1200×630이며 한글 제목이 읽힌다.
- 없는 문서와 alias 응답에는 별도 BlogPosting이 없다.

단위 검사는 `mise exec -- pnpm --filter docs test:lib`, 전체 상세 회귀는 `mise exec -- pnpm --filter docs test:article:prod`로 실행한다. 로컬 fixture 서버와 프로덕션 빌드를 사용한다. 상세·OG 두 파일만 실행하려면 `apps/docs`에서 `mise exec -- pnpm exec playwright test --config=playwright.article.config.ts article-detail.spec.ts article-sharing.spec.ts`를 사용한다.

실제 수행 결과는 [2026-10-03 SEO 검증](../verification/seo/2026-10-03-article-sharing.md)에 기록했다.

## OG 브라우저 캐시와 CDN 캐시 분리

2026-10-05 운영 표본은 Vercel 직접 응답 `max-age=3600`, Cloudflare를 거친 공개 응답 `max-age=14400`이었다. 특정 Cloudflare 규칙의 실제 값은 미확인이다. [관측 결과](../verification/security/2026-10-05-deployed-blog-smoke.md)를 참고한다.

앱은 다음 두 헤더로 기존 TTL 의도를 구분한다.

```http
Cache-Control: public, max-age=3600
Vercel-CDN-Cache-Control: public, s-maxage=86400
```

- 브라우저: 같은 URL의 PNG를 1시간 재사용할 수 있다.
- Vercel CDN: 생성된 PNG를 1일 캐시하도록 지정한다. 캐시 가능 조건과 배포 무효화 등에 따라 항상 1일 보존을 보장하지는 않는다.
- Cloudflare: 별도 중간 CDN이다. Vercel 전용 헤더는 이 서비스의 TTL을 설정하지 않는다. `Browser TTL` 덮어쓰기가 있으면 앱의 브라우저 1시간 값을 바꿀 수 있다.

Vercel은 전용 헤더를 소비하므로 공개 응답에 `Vercel-CDN-Cache-Control`이 없다고 실패로 판단하지 않는다. 로컬 `next start`는 이 헤더가 보이므로 로컬 E2E에서 앱 지정 계약을 검사한다. [Vercel 공식 설명](https://vercel.com/docs/caching/cache-control-headers).

### Cloudflare에서 필요한 조치

프로젝트 담당자가 zone 설정 변경 권한과 기존 규칙을 확인하고 실행한다. 코드 커밋만으로 Cloudflare 설정이 변경되지는 않는다.

1. Cloudflare의 `heap-forge.app` zone에서 Caching의 Browser Cache TTL과 `/og/article.png`에 적용되는 Cache Rules를 먼저 확인한다. 변경 전 값·규칙 순서를 기록한다.
2. OG에만 적용할 Cache Rule을 만들거나 기존 규칙을 수정한다. 조건은 다음처럼 공개 호스트와 이미지 경로로 제한한다. 다른 정적 자산·인증 API의 캐시 정책은 변경하지 않는다.

```txt
(http.host eq "heap-forge.app" and http.request.uri.path eq "/og/article.png")
```

3. 해당 규칙의 `Browser TTL`을 `Respect origin`으로 지정한다. 중첩된 규칙이 다시 `Override origin`을 적용하는지도 확인한다. 전역 설정을 바꿀 경우 영향 범위가 전체 자산이므로 별도로 검토한다. [Cloudflare Cache Rules 설정](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).
4. 앱 변경이 배포된 뒤 새 테스트 query로 공개 GET 응답을 조회한다. 헤더·PNG 성공을 함께 확인한다. 오래된 CDN 객체가 남아 있다면 검토한 OG URL만 선택적으로 purge하고 재확인한다. 전체 사이트 purge나 WAF 변경은 필요하지 않다.

```sh
curl -sS -D /tmp/heap-forge-og-headers.txt \
  -o /tmp/heap-forge-og.png \
  'https://heap-forge.app/og/article.png?v=ttl-check-20261005&title=HEAP-FORGE&topic=WEB'
```

기대 결과는 HTTP 200·PNG이며 브라우저용 `Cache-Control`의 `max-age`가 3600이다. Cloudflare가 다른 directive를 더할 수 있어 문자열 전체보다 해당 TTL과 캐시 가능성을 확인한다. 반복 요청의 HIT/MISS·Age는 CDN 동작 표본이지 정확히 1일 보존됐다는 증거는 아니다.

purge는 이미 브라우저에 저장된 PNG를 삭제하지 않는다. 같은 이미지 URL을 유지한 디자인 변경에는 metadata URL의 `v` 변경도 필요하다. 브라우저 캐시·Vercel 캐시·Cloudflare 캐시·외부 공유 서비스의 미리보기 캐시는 서로 다른 계층이다.

설정 변경 후 실패하면 기록한 OG 전용 규칙을 원래 값으로 되돌리고 응답을 재확인한다. 앱 헤더를 임의로 4시간으로 바꿔 설정 불일치를 숨기지 않는다. 보호된 배포를 비교할 때 bypass secret과 쿠키를 공유하지 않으며 CLI가 우회 토큰을 생성할 수 있다는 점도 사전에 확인한다.

배포 후에는 실제 글 URL로 [Rich Results Test](https://search.google.com/test/rich-results)와 [Schema Markup Validator](https://validator.schema.org/)를 실행한다. 검색 노출 여부와 공유 서비스의 캐시 갱신 결과는 배포 후 별도로 확인한다.

PNG 생성이 실패하면 `public/fonts/Pretendard-Bold.otf`가 배포 함수의 파일 추적 결과에 포함되어 있는지 확인한다. 제목이 이전 버전이면 OG query와 공유 서비스의 미리보기 캐시를 확인한다. 구조화 데이터 날짜 오류는 frontmatter/API 날짜를 수정하고 기존 revalidation 절차를 적용한다.
