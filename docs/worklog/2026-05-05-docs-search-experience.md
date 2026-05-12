# 2026-05-05 Docs 검색 경험 정리

## 요약

- `docs` 검색이 현재 라우트 구조와 맞지 않던 부분을 정리
- 검색 결과를 `/docs?q=...` 통합 상태로 유지하되 전용 결과 화면처럼 보이도록 조정
- 로컬 검색 대상을 `data`와 `category` 문서까지 포함하도록 확장
- 추천 검색어와 empty state 흐름 추가
- 검색 경험 목표를 architecture 문서로 정리

## 변경 내용

- `apps/docs/lib/get-search-data.ts`
- `apps/docs/feature/search/ui/search.tsx`
- `apps/docs/feature/search/empty-search-result.tsx`
- `apps/docs/app/docs/page.tsx`
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/architecture/docs-search-experience-policy.md`
- `docs/worklog/2026-05-05-docs-search-experience.md`
- `docs/todo/platform-improvement-todo.md`

## 메모

- 예전처럼 별도 검색 라우트를 복원하는 대신, 현재 정보구조에 맞춰 `/docs?q=...`를 검색 결과 상태로 해석했다.
- 검색 결과 링크는 로컬 문서의 실제 위치(`docs` 상세 또는 `category` 상세)에 맞춰 생성되도록 정리했다.
- 검색 범위는 `title / summary / taxonomy / content` 순으로 해석하는 정책을 문서화했다.
