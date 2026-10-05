# Docs Article Metadata Policy

## 상태와 범위

- 상태: 적용 중
- 대상: docs 앱의 공개 문서 상세
- 최종 검토: 2026-10-05

구현은 `feature/docs` 작업 트리에 반영했다. 배포 후 검색 엔진 및 공유 서비스의 결과는 미검증이다.

## Purpose

HeapForge 문서 상세 페이지가 사이트 공통 metadata가 아니라 문서별 title, summary, canonical URL, image를 사용하도록 정책을 고정한다.

## Scope

우선 적용 대상은 canonical 상세 라우트다.

```txt
/docs/{channel}/{articleSlug}
```

예:

- `/docs/web/javascript-event-loop-runtime`
- `/docs/feed/pna`
- `/docs/ui-ux/blocked-aria-hidden`
- `/docs/mobile/touch-targets`
- `/docs/category/fe/react/server-client-component-boundary`

`/category/{main}/{sub}/{slug}` 상세는 legacy/category browsing alias로만 유지한다. 직접 렌더링하지 않고 `/docs/category/{main}/{sub}/{slug}`로 redirect한다.

목록, 허브, 정적 페이지 metadata는 별도 page-level 정책인 `docs-page-metadata-policy.md`를 따른다.

## Metadata Source Priority

문서 상세 metadata는 article payload를 기준으로 만든다.

필드 기준:

- `title`: metadata title, OG title, Twitter title
- `summary`: description, OG description, Twitter description
- `markdownPath`: canonical route 계산의 1순위 source
- `slug`: leaf fallback
- `thumbnail`: 구조화 데이터의 대표 이미지. OG/Twitter는 제목 기반 이미지를 사용한다.
- `date`: article published time
- `updatedAt`: article modified time
- `authorName`: author metadata
- `tags`: keyword/tag metadata
- `topicLabel`: article section metadata

## Canonical URL Rule

상세 페이지 canonical URL은 `getDocHref()` 결과에 현재 URL의 locale(`/ko`, `/en`)을 붙이고 `DOCS_SITE_URL` origin을 사용한다. JSON-LD의 `url`, `@id`, `mainEntityOfPage`도 같은 주소를 사용한다.

예:

```txt
DOCS_SITE_URL=https://heap-forge.app
markdownPath=web/javascript-event-loop-runtime
canonical=https://heap-forge.app/ko/docs/web/javascript-event-loop-runtime
```

즉 metadata canonical과 실제 redirect canonical은 같은 route 계산 함수를 공유해야 한다.

category 기반 문서는 channel hub가 아니라 taxonomy source에서 시작한 문서이므로 `/docs/category/{main}/{sub}/{slug}`를 canonical route로 사용한다.

## Image Rule

OG/Twitter는 `/og/article.png?v=1&title=...&topic=...&author=...`에서 생성하는 1200×630 PNG를 사용한다. 제목·분야·작성자는 이미 선택한 문서에서 가져오므로 이미지 요청 때문에 NAS를 다시 조회하지 않는다. OG 이미지 변경이 목록 카드의 thumbnail을 바꾸지는 않는다.

제목 90자, 분야 28자, 작성자 32자까지 표시하고 초과 부분은 말줄임한다. 한글은 공식 Pretendard v1.3.9 Bold OTF를 런타임 파일로 읽으며 해당 이미지 라우트의 `outputFileTracingIncludes`에 명시한다. 기존 OFL 라이선스를 유지한다. WOFF2는 ImageResponse 지원 형식이 아니므로 웹 본문용 글꼴을 그대로 사용하지 않는다.

브라우저 캐시 1시간, 공유 캐시 1일을 사용한다. 제목 변경 시 query가 바뀌며, 이미지 디자인 변경 시 URL의 `v`를 올린다. 공유 서비스 자체의 미리보기 캐시는 별도 갱신이 필요할 수 있다. 공개 이미지 엔드포인트는 텍스트만 받고 임의 이미지 주소를 읽지 않는다.

2026-10-05 작업 트리에서는 브라우저용 `Cache-Control: public, max-age=3600`과 Vercel 전용 `Vercel-CDN-Cache-Control: public, s-maxage=86400`을 분리했다. Vercel 전용 헤더는 공개 응답에서 소비되며 Cloudflare의 TTL을 지정하지 않는다. 공개 도메인의 4시간 browser TTL 표본은 [OG 캐시 조치 절차](../runbooks/docs-seo-metadata-routes.md#og-브라우저-캐시와-cdn-캐시-분리)에 따라 Cloudflare에서 별도 확인한다. 운영 설정 변경·새 배포 검증은 미실행이다.

## 구조화 데이터

공개 상세에 서버 렌더링된 `application/ld+json` 스크립트를 하나 넣는다. 로컬 MDX와 원격 HTML이 공통 `ArticleStructuredData`를 사용한다. alias 리디렉션과 없는 문서에는 글 데이터를 생성하지 않는다.

- 타입은 `BlogPosting`이며 제목, 요약, 작성자, 발행일, 수정일, 분야, 태그와 canonical 주소를 사용한다.
- 대표 이미지는 실제 thumbnail을 절대 URL로 변환하고, 없으면 제목 기반 OG 이미지로 대체한다.
- 작성자나 날짜가 없거나 날짜가 잘못되면 생략한다. 날짜만 주어지면 시간을 임의로 만들지 않는다. 실제 발행 시간이 있으면 시간대가 포함된 ISO 8601을 권장한다.
- UI locale과 글의 실제 언어가 같다고 보장할 수 없으므로 `inLanguage`를 추정하지 않는다.
- 직렬화 후 `<`를 `\\u003c`로 치환해 원격 메타데이터가 script 태그를 닫지 못하게 한다.
- 구조화 데이터 추가가 검색 순위 상승이나 특정 검색 결과 형식을 보장하지는 않는다.

## 대안과 영향

기존 thumbnail만 공유에 사용하면 새 렌더링 비용은 없지만 제목이 없는 공통 이미지가 반복된다. 선택한 방식은 글 제목을 공유 카드에서 읽을 수 있고 NAS 이미지 장애의 영향을 줄인다. 대신 OG 요청 시 이미지 생성 비용과 글꼴 파일 배포가 필요하다. 색인용 대표 이미지는 기존 thumbnail을 유지한다.

## Request Cost Rule

`generateMetadata()`와 page render는 같은 상세 문서를 필요로 한다.

따라서 `/docs/[...slugParts]` route에서는 `cache(getDocByRoutePath)`를 사용해 같은 request 안에서 문서 조회 결과를 재사용한다.

## Non-goals

- 검색 결과 metadata를 동적으로 만든다.
- locale별 alternate link를 이 작업에서 함께 확장한다.

## 관련 문서

- [SEO 확인 절차](../runbooks/docs-seo-metadata-routes.md)
- [구현 기록](../worklog/2026-10/2026-10-03-article-structured-data-og.md)
- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [Google Article 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/article)
