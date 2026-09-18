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
