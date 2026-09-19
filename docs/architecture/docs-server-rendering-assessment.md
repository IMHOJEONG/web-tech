# 블로그 SSR 필요성 검증

## 상태와 범위

- 상태: 적용 중
- 대상: docs 앱의 서버 렌더링과 정적 생성 정책
- 최종 검토: 2026-09-19

## 배경

SSR을 추가해야 하는지 판단하기 위해 현재 경로별 렌더링 방식과 서버 HTML 응답을 확인했다.

## 결정

2026-09-18 기준 docs는 이미 서버 렌더링과 정적 생성을 혼합한다.
클라이언트 전용 블로그를 SSR로 전환해야 하는 상태가 아니다. 전체 force-dynamic 전환은 하지 않는다.
Server Component는 실행 위치를 뜻하고, 요청마다 실행되는 SSR인지 빌드 시 생성되는 SSG인지는 별도 판단이다.
SEO를 위해 서버가 생성한 HTML이 필요한 것과 매 요청마다 새 HTML을 생성해야 하는 것은 다르다.

## 프로덕션 빌드 관측

운영 모델의 격리 next build --webpack + next start에서 다음 분류를 확인했다.

| 화면 (ko/en 공통)             | 관측             | 권장                                                             |
| ----------------------------- | ---------------- | ---------------------------------------------------------------- |
| 홈, web/mobile/ui-ux          | SSG, 캐시 재검증 | 유지. 공개 콘텐츠를 요청마다 다시 렌더링할 필요가 낮다.          |
| about/privacy/terms/changelog | SSG              | 유지. 요청별 정보가 없다.                                        |
| docs, feed                    | Dynamic          | query 기반 검색/필터를 서버에서 처리하는 현재 방식 유지.         |
| docs 상세                     | Dynamic          | 서버 본문 생성 유지. 인기 글 정적 생성은 성능 측정 후 별도 검토. |
| category 루트                 | SSG              | 유지.                                                            |
| category 하위/상세            | Dynamic          | 실제 요청 비용이 크면 정적 경로 열거/캐시를 검토.                |

시험은 BLOG_CONTENT_REVALIDATE_SECONDS=3600과 모의 콘텐츠 서버를 사용한다.
따라서 빌드 표의 1h는 시험 값이며 배포 환경의 설정값으로 간주하면 안 된다. 코드 기본값은 300초다.
실제 Vercel 배포의 경로 분류와 지연 시간은 이 검증의 범위가 아니다.

## HTML 검증

```sh
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs
```

시험 runner에 빌드 경로 표 출력과 HTML 본문 검증을 보강했다.
Node fetch로 `/en/docs/feed/cache-probe` 응답을 읽고 모든 script 요소를 제거한 후 article 내부에 CACHE_BODY_V3가 있는지 확인했다.
브라우저 JavaScript 실행이나 hydration payload에만 들어 있는 텍스트를 성공으로 판정하지 않는다.
단, 스트리밍 응답 전체를 읽은 검증이다. 첫 바이트에 완성 본문이 들어 있다는 뜻은 아니며, JS 비활성 브라우저에서의 표시 완료와도 별도다.
언어 URL/SEO/API/404, 인증, expire: 0, max 갱신 및 V3 상세 본문 검증이 모두 통과했다.

## 유지할 서버 책임

원격 콘텐츠 토큰 사용, Markdown/HTML 처리, metadata 생성은 계속 서버에서 수행한다.
동적 렌더링에서도 원격 fetch 결과는 캐시할 수 있다. SSR 요청마다 반드시 NAS에 다시 요청해야 하는 것은 아니다.
현재 콘텐츠 조회는 next.revalidate와 tag를 전달하고, 인증된 webhook은 해당 tag를 expire: 0으로 무효화한다.
React cache는 요청 내 중복 계산을 줄이는 역할이며 지속적인 데이터 캐시와 동일하지 않다.

상세 렌더링의 로컬 전체 문서 읽기에는 요청 단위 React cache를 적용한다.
문서 선택과 부가 영역이 같은 스냅샷을 사용하되 호출자에게 배열 복사본을 반환한다.
원격 응답 캐시나 렌더링 결과의 요청 간 캐시는 추가하지 않는다. 별도 검색·카테고리
파서 통합은 기존 정규화 차이를 검토한 뒤 진행한다.

## 대안과 영향

전체 force-dynamic은 매 요청의 서버 비용과 원격 장애 영향을 늘릴 수 있어 채택하지 않는다.
인기 글의 SSG/ISR 또는 렌더 결과 캐시는 대안이지만 신선도와 무효화 범위를 함께
검증해야 한다. 아래 측정에서 반복되는 병목이 확인되면 해당 경로부터 재검토한다.

### 다음 측정

- 실제 배포의 cold/warm TTFB, LCP, 원격 장애 시 본문 도달 시간을 비교한다.
- 상세 Markdown 렌더링과 관련 문서 조회가 시간을 얼마나 쓰는지 분리 측정한다.
- 빌드 시 NAS 접근 실패 후 fallback이 캐시되는 경우 정상 복구와 webhook 반영을 확인한다.
- 비용이 큰 상세부터 SSG/ISR 또는 렌더 결과 캐시를 시험한다. 모든 라우트를 강제 정적/동적으로 변경하지 않는다.
- Cache Components는 SSR을 위한 필수 요건이 아니다. 기존 중첩 캐시 신선도 문제가 해결될 때까지 운영 도입은 보류한다.

## 관련 문서

- [검증 변경 이력](../worklog/2026-09/2026-09-18-docs-ssr-verification.md)
- [캐시 통합 시험](../runbooks/docs-content-cache-production-test.md)
- [스트리밍 측정 절차](../runbooks/docs-article-streaming-performance.md)

- [Next.js Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
