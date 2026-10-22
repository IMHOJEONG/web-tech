# Docs Content Routing Policy

## Purpose

`apps/docs`의 공개 문서 URL과 원격 콘텐츠 메타 규칙을 고정한다.

핵심 목표:

- 공개 URL이 채널 구조를 드러내도록 한다.
- `slug`, `id`, `markdownPath`의 역할을 분리한다.
- 같은 leaf slug가 여러 채널에 있어도 충돌하지 않게 한다.

## Public Route Rule

문서 상세 공개 URL은 아래 형태를 기본으로 사용한다.

```txt
/docs/{channel}/{articleSlug}
```

예:

- `/docs/feed/pna`
- `/docs/web/rendering-pipeline`
- `/docs/ui-ux/blocked-aria-hidden`
- `/docs/mobile/touch-targets`

추가 기준:

- `/feed`, `/web`, `/mobile`, `/ui-ux`
  - 허브/인덱스/큐레이션 라우트
- `/docs/{channel}/{articleSlug}`
  - 상세 canonical route

즉 채널 페이지와 상세 페이지는 역할을 분리한다.

## Field Semantics

`markdownPath`

- 콘텐츠 저장 위치를 나타내는 상대 경로
- 확장자 제외
- 예: `feed/pna`, `web/rendering-pipeline`

`slug`

- leaf slug만 사용
- 채널 prefix를 다시 넣지 않음
- 좋은 예: `pna`
- 나쁜 예: `feed-pna`

`id`

- 전역 유일 식별자
- `markdownPath` 그대로 쓰는 방식을 권장
- 예: `feed/pna`, `web/rendering-pipeline`

## Naming Rules

- `channel`은 `feed`, `web`, `mobile`, `ui-ux` 중 하나를 사용한다.
- `articleSlug`는 lowercase kebab-case를 기본으로 한다.
- `slug`에는 채널 prefix를 중복하지 않는다.
- React key나 리스트 dedupe에는 `href`보다 `id`를 우선 사용한다.

## Canonical Source Rule

공개 상세 route 계산의 canonical source는 `markdownPath`다.

우선순위:

1. `markdownPath`
2. `fileName` 기반 channel mapping
3. `slug`

의미:

- `slug`는 사람이 읽는 leaf 값이다.
- `markdownPath`는 저장 구조와 공개 route를 연결하는 구조적 식별자다.
- 같은 `slug`가 다른 channel에 존재해도 `markdownPath`가 다르면 충돌하지 않는다.

## Redirect / Alias Rule

허용 가능한 alias가 있더라도 canonical URL은 하나로 수렴해야 한다.

예:

- legacy slug-only route
- old duplicated leaf route
- 과거 channel prefix가 중복된 route

이 경우에도 최종 공개 기준은 `/docs/{channel}/{slug}`로 유지한다.

category 기반 문서는 channel hub가 아니라 taxonomy source에서 시작한 문서이므로 `/docs/category/{main}/{sub}/{slug}`를 canonical route로 사용한다.

예:

```txt
/category/fe/react/server-client-component-boundary
-> /docs/category/fe/react/server-client-component-boundary
```

## Category Input Boundary

2026-10-05 보안 브랜치 작업 트리에 반영했다. main 병합·배포 브랜치 동기화·운영 검증은 아직 완료하지 않았다.

- `/category/{main}`은 `categoryTree`의 정확한 main 값만 허용한다.
- `/category/{main}/{sub}`와 legacy 상세는 `getCategoryTopic`으로 **실제 main·sub 조합**을 검증한다. 다른 main에 존재하는 sub도 허용하지 않는다.
- 대소문자 변경, glob 문자, 경로 이동 문법을 정리하거나 대체하여 허용하지 않는다. taxonomy에 없는 값은 `notFound()`로 처리한다.
- `getSubCategoryData`·`getCategoryData`도 같은 경계를 검사한다. 잘못된 조합은 파일 검색 전에 `[]`를 반환한다. 페이지 검사만 믿지 않는다.
- 디렉터리 경로는 검증을 통과한 taxonomy 설정값으로 조합한다. URL 문자열을 직접 삽입하거나 glob 패턴으로 해석하지 않는다.
- taxonomy를 확장할 때 설정과 실제 콘텐츠 디렉터리를 함께 추가한다. 허용 조합 검사도 실제 taxonomy를 읽어 실행한다.

10-05의 입력 경계 보강은 패키지 패치와 별개다. 10-09에는 [ADR-0014](adr-0014-local-content-file-discovery.md)에 따라 docs의 카테고리·검색·revision 탐색을 기본 파일 API로 변경해 직접 운영 glob 경로를 제거했다. 개발 도구의 `braces`는 남아 있으며 패치 완료로 표시하지 않는다.

Next.js 스트리밍에서 not-found는 HTTP `200`으로 나갈 수 있다. 오류 화면·`noindex`를 검사하고, canonical 리다이렉트도 HTTP 상태뿐 아니라 최종 URL·본문으로 확인한다. [구현·검증 보고서](../verification/security/2026-10-05-next-category-hardening.md).

## Backend Contract

권장 응답 예:

```json
{
  "id": "feed/pna",
  "slug": "pna",
  "title": "PNA",
  "summary": "Protocol notes.",
  "markdownPath": "feed/pna"
}
```

이때:

- 본문 API: `/posts/feed/pna`
- 공개 상세 URL: `/docs/feed/pna`

## Frontend Mapping

`apps/docs`는 아래 우선순위로 공개 route path를 계산한다.

1. `markdownPath`
2. `fileName` 기반 channel mapping
3. `slug`

즉 `slug`는 마지막 fallback이고, 공개 URL의 주 source는 `markdownPath`다.

## Classification Contract

2026-10-22 `codex/vuln-production-main`에서 분류 수정 `6f6974e`와 브라우저 회귀 `3f8bf5e`로 분리했다.
CI용으로는 main `4e61767` 기반 `codex/docs-canonical-taxonomy-kan29`에 블로그 변경만 옮겼다.
기존 운영 문서·브랜치는 보존하며 이 PR에 함께 포함하지 않는다.
로컬 검증 결과이며 원격 CI·운영 배포 여부는 [작업 기록](../worklog/2026-10/2026-10-22-docs-canonical-taxonomy.md)에서 구분한다.
기존 공개 URL과 backend route 검증 계약은 변경하지 않는다.

검색 section과 채널 판별은 `apps/docs/lib/document-taxonomy.ts`의 공용 분류기를 사용한다.
메타데이터 객체에서는 비어 있지 않은 `markdownPath` → canonical `href` → `fileName` → `path` 순서로 선택한다.
앞선 경로가 `feed/…`처럼 일반 문서인 경우에도 저장용 `fileName`으로 다시 추측하지 않는다.
검색 항목에는 `markdownPath`가 없으므로 이미 계산한 canonical `href`를 사용한다.

| 경로                                                                        | 검색 section     | 채널   |
| --------------------------------------------------------------------------- | ---------------- | ------ |
| `web/…`, `category/fe/…`, `data/v8/…`                                       | Web              | web    |
| `ui-ux/…`, `data/shadcn/…`                                                  | UI/UX            | uiux   |
| `mobile/…`, `category/mobile/…`, `category/fe/{react-native,ios,android}/…` | Mobile           | mobile |
| `category/be/…`                                                             | Backend          | other  |
| `category/infra/…`                                                          | Infrastructure   | other  |
| `category/computer-science/…`                                               | Computer Science | other  |
| `feed/…`, 미분류 경로                                                       | Docs             | other  |

Mobile의 명시적 로컬 경로는 일반 `category/fe/…`보다 먼저 검사한다.
`web/android/…`는 명시적인 Web 문서이며 파일명 중간의 단어만 보고 Mobile로 바꾸지 않는다.
선행·후행 slash, Windows 구분자, `.md`·`.mdx`·`.html`, legacy `apps/docs/` 경로와
한국어·영어 canonical 링크를 분류 전에 정리한다. 이 정리는 분류용이며 입력 허용·경로 접근 권한 검증을 대체하지 않는다.

- `/docs`의 Mobile 요약·필터와 두 언어 문구를 함께 제공한다.
- 허브는 공개 인덱스를 한 번 받아 같은 분류기로 필터링한다. Web만 로컬 카테고리를 다시 조회해 합치지 않는다.
  인덱스가 선택한 원격 우선·canonical route 중복 제거를 그대로 유지한다.
- Feed와 랜딩의 채널 판별도 같은 메타데이터를 전달한다. 명시한 `topicLabel`은 보존한다.
- 관련 글은 이미 `getDocHref`를 사용한다. 카테고리별 세부 추천 점수는 유지하고 로컬 alias·원격 canonical 경로의
  일치와 저장 경로 충돌을 회귀 검사한다. 모든 Web 문서를 같은 추천 카테고리로 합치지 않는다.

변경과 검증 범위는 [분류 불일치 수정 기록](../worklog/2026-10/2026-10-22-docs-canonical-taxonomy.md)을 따른다.

## Decision Summary

1. 채널 허브와 상세 route는 역할을 분리한다.
2. 상세 canonical URL은 `/docs/{channel}/{slug}`로 고정한다.
3. `markdownPath`를 상세 route의 주 source로 사용한다.
4. `slug`는 leaf slug만 사용하고 channel prefix를 중복하지 않는다.
