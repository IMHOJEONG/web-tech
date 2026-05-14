# 2026-05-15 docs route trailing leaf 중복 정규화

## 요약

- 원격 문서 경로 중 일부가 `/docs/feed/pna/pna`처럼 마지막 leaf가 한 번 더 붙는 형태로 공개되고 있었다.
- 프론트 라우트 생성 단계에서 `feed/pna/pna -> feed/pna`로 정규화하도록 수정했다.
- 기존 중복 URL은 더 이상 같은 문서로 허용하지 않도록 route match 완화 로직을 제거했다.

## 이유

- backend의 `markdownPath`가 폴더명과 파일명이 반복되는 구조일 때, 프론트가 그 값을 그대로 공개 URL로 사용하면 path가 어색해진다.
- 공개 URL은 `channel/leaf-slug` 형태가 더 자연스럽고, 검색/랜딩/상세 링크도 그 규칙을 따르는 편이 낫다.
- 잘못된 과거 URL까지 계속 허용하면 canonical 경로가 흐려지고, 중복 경로가 계속 남게 된다.

## 산출물

- `apps/docs/lib/get-doc-route.ts`
