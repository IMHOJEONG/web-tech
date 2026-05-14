# 2026-05-15 원격 콘텐츠 zod 검증 추가

## 요약

- 원격 content payload를 프론트에서 받을 때 `zod`로 최소 라우트 계약을 검증하도록 추가했다.
- 이제 `markdownPath`는 `channel/leaf-slug` 형태만 허용한다.
- `feed/pna/pna` 같은 중복 경로나 비정상 `slug`는 정규화 단계에서 거부된다.

## 이유

- backend 계약 문서만으로는 잘못된 payload가 실제 런타임에 내려오는 상황을 막기 어렵다.
- 공개 URL 규칙을 안정적으로 유지하려면 프론트도 최소 계약을 검증해야 한다.

## 산출물

- `apps/docs/lib/content-api-schema.ts`
- `apps/docs/lib/content-api-normalize.ts`
