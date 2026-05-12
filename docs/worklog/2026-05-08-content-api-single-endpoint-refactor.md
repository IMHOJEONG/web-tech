# 2026-05-08 Content API Single Endpoint Refactor

## 요약

- `apps/docs/lib/content-api.ts`를 역할별 파일로 분리했다.
- remote content endpoint 선택 방식을 `여러 후보 fallback`에서 `단일 endpoint 선택`으로 되돌렸다.

## 이유

- `401`이나 인증 실패가 나도 다음 후보를 계속 시도하면서
  - 외부 URL 실패 뒤 내부 URL timeout이 이어지고
  - 어떤 endpoint가 실제 문제인지 로그 해석이 어려워졌다.
- `content-api.ts` 파일도 700줄 이상으로 커져서 유지보수가 어려웠다.

## 적용 내용

- 신규 분리 파일
  - `apps/docs/lib/content-api-types.ts`
  - `apps/docs/lib/content-api-config.ts`
  - `apps/docs/lib/content-api-html.ts`
  - `apps/docs/lib/content-api-normalize.ts`
- 메인 파일
  - `apps/docs/lib/content-api.ts`
  - fetch orchestration만 남기도록 정리

## 엔드포인트 규칙

- 현재 우선순위:
  1. `BLOG_CONTENT_API_BASE_URL_PUBLIC`
  2. `BLOG_CONTENT_API_BASE_URL_INTERNAL`
  3. `BLOG_CONTENT_API_BASE_URL`
- 본문 endpoint도 같은 규칙으로 선택한다.
- 즉 한 번에 하나의 주소만 사용하고, 실패해도 다른 후보를 연쇄 호출하지 않는다.

## 메모

- `*_BASE_URLS` 기반 fallback 실험은 이 시점부터 운영 기준에서 제외한다.
- 네트워크 위치가 복잡하더라도 endpoint 선택은 명시적으로 하나만 보이게 두는 편이 디버깅과 보안 로그 해석에 유리하다.
