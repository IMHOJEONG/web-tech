# 언어별 URL 라우팅 정책

## 결정

2026-09-14부터 화면 URL은 `/ko/...`, `/en/...`으로 구분한다.
`app/[locale]`의 페이지, 컴포넌트, 콘텐츠 조회 로직은 공유한다.
`app/ko`와 `app/en`을 각각 만들지 않는다.

- `/ko/docs`: 한국어 문서 목록 UI.
- `/en/docs`: 영어 문서 목록 UI.
- `/ko/docs/web/example`, `/en/docs/web/example`: 같은 문서의 언어별 화면.
- `/api/search`, `/api/revalidate/content`, 이미지, robots.txt, sitemap.xml은 언어 접두어를 붙이지 않는다.

## 언어 선택과 이전 URL

명시된 URL의 언어가 쿠키와 Accept-Language보다 우선한다.
언어 없는 기존 URL은 next-intl Proxy가 쿠키, Accept-Language, 기본 영어 순으로 판단해 임시 리디렉션한다.
검색어와 페이지 번호 등 query string은 유지한다. 언어가 사용자마다 다르므로 기존 URL을 특정 언어로 영구 고정하지 않는다.
헤더의 KO/EN 링크는 현재 경로와 검색 조건을 유지한다.
미지원 언어 경로는 대응 페이지가 없으면 404로 처리한다.

## 두 번 관리하는가?

페이지 구현과 Markdown 원본은 한 번만 관리한다. 기존 ko.json/en.json의 UI 메시지 관리도 동일하다.
언어별 URL을 만든다고 Markdown 본문이나 frontmatter가 자동 번역되지는 않는다.
따라서 `/en`에서도 원문이 한국어이면 본문은 한국어이다. 향후 본문 번역은 별도 정책으로 결정한다.

추가 비용은 다음과 같다.

- 두 언어의 라우팅, 화면, 링크, metadata 회귀 테스트가 필요하다.
- 정적 생성 가능한 화면은 언어별 산출물이 생겨 빌드와 캐시 항목이 늘 수 있다.
- canonical, hreflang, sitemap 및 이전 URL 리디렉션을 함께 관리해야 한다.
- 실제 본문 번역을 도입할 때만 번역 원본 동기화와 검수 비용이 추가된다.

## 구현 경계

- `shared/i18n/routing.ts`: 언어 및 prefix 정책.
- `shared/i18n/navigation.ts`: locale-aware Link/router/pathname. pathname은 prefix를 제거해 기존 메뉴 활성화 판단을 유지한다.
- `shared/message/request.ts`: Next 16.3의 `next/root-params`에서 locale을 읽는다. 화면 번역이 쿠키/헤더에 직접 의존하지 않는다.
- `lib/localized-metadata.ts`: 기존 metadata 생성기를 감싸 언어별 canonical, OG URL, hreflang을 만든다.
- `app/sitemap.ts`: 두 언어의 URL과 대체 언어 링크를 출력한다.
- 콘텐츠 id, slug, 저장 경로, 원격 API 주소는 변경하지 않는다.

본문에 직접 쓴 언어 없는 링크와 전역 오류 화면의 홈 링크는 기존 URL 리디렉션을 거친다.
일반 UI 링크는 locale-aware Link를 사용한다. 외부 링크와 자산 URL에는 prefix를 붙이지 않는다.

## 캐시 시험과의 관계

URL에서 언어를 결정하면 요청 쿠키를 읽기 위해 정적 셸 전체를 동적으로 만들 필요가 줄어든다.
그러나 이것만으로 모든 Cache Components 정적 셸 검증 통과를 보장하지 않는다.
이번 변경은 운영 Cache Components를 활성화하거나 instant 검증을 완화하지 않는다.
기존 locale 실험 중 쿠키 기반 결과는 당시 구현에 대한 기록이다. 현재 시험 도우미는 URL 우선 정책을 검증한다.

## 재현

저장소 루트에서 실행한다. 테스트는 실제 NAS 대신 인증된 모의 원격 서버와 임시 앱 복사본을 사용한다.

```sh
mise exec -- node --experimental-strip-types --test apps/docs/shared/config/locale-path.test.ts
mise exec -- node apps/docs/scripts/test-content-cache-prod.mjs
```

통합 테스트는 `next build --webpack`, `next start` 후 URL 우선순위, 이전 URL query 유지, 언어별 HTML/canonical/hreflang, sitemap, 비인증 API 401, 404를 확인한다.
이어서 기존 expire: 0/max 재검증과 상세 문서 V3 렌더링을 확인한다.
개발 서버에서 수동으로 `/ko/docs`, `/en/docs`, `/ko/about`, `/en/about`을 열어 언어 전환과 모바일 헤더 폭을 확인한다.

## 참고

- [next-intl 라우팅 설정](https://next-intl.dev/docs/routing/setup)
- [next-intl Navigation](https://next-intl.dev/docs/routing/navigation)
