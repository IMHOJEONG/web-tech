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

## robots.txt 정책

- 모든 사용자 에이전트에 `/` 접근을 허용한다.
- 검색 결과나 앱 내부 구현 경로로 볼 수 있는 `/api/`, `/_next/`, `/open/`은 크롤링하지 않도록 안내한다.
- 보안 차단은 `robots.txt`가 아니라 `apps/docs/proxy.ts`의 request blocklist가 담당한다.

## sitemap.xml 정책

- 정적 라우트와 로컬 문서 라우트만 포함한다.
- 원격 콘텐츠 API는 sitemap 생성 시 호출하지 않는다.
  - 원격 서버 장애가 sitemap 응답 지연이나 Vercel timeout으로 이어지는 것을 막기 위함이다.
  - 원격 문서 sitemap은 콘텐츠 API 안정화 후 별도 feed 또는 사전 생성 방식으로 확장한다.

## 확인 명령

```bash
curl -I https://heap-forge.app/robots.txt
curl -I https://heap-forge.app/sitemap.xml
curl https://heap-forge.app/robots.txt
curl https://heap-forge.app/sitemap.xml
```
