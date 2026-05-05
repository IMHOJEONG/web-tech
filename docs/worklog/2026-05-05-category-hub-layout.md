# Worklog: 2026-05-05 Category Hub Layout

## Summary

- `/category`를 단순 카드 나열에서 허브형 탐색 페이지로 재구성
- 상단 hero, 메인 카테고리, 하단 `인기 주제` 섹션을 추가
- 카테고리 진입 흐름이 home hero와 더 자연스럽게 이어지도록 정리
- `/category/[main]`, `/category/[main]/[sub]`도 같은 허브 톤으로 정리
- 메인/서브 카테고리 카드에 문서 수와 최근 업데이트 메타데이터를 추가

## Changed

- `apps/docs/app/category/page.tsx`
- `apps/docs/app/category/layout.tsx`
- `apps/docs/app/category/[main]/page.tsx`
- `apps/docs/app/category/[main]/[sub]/page.tsx`
- `apps/docs/entities/category/ui/category-document-card.tsx`
- `apps/docs/lib/get-category.ts`
- `docs/worklog/2026-05-05-category-hub-layout.md`

## Notes

- 기존 `/category`는 뱃지 줄과 카드 그리드만 있어 허브로서의 역할이 약했다.
- 메인 카테고리 선택이 먼저 보이고, 그 다음에 바로 인기 주제로 점프할 수 있는 흐름이 더 적합하다고 판단했다.
- `Frontend / Backend / Computer Science`는 큰 분류로 유지하고, 하단 `인기 주제`는 실제 하위 기술 링크로 연결했다.
- `category` 레이아웃 래퍼는 `min-w-0 flex-1` 기준으로 정리해 sidebar와 함께 있을 때 본문 그리드가 찌그러지는 문제를 줄였다.
- 카테고리 overview는 실제 문서 파일을 읽어 문서 수와 최근 업데이트 제목/날짜를 계산하도록 정리했다.
- category 전용 fixed sidebar가 footer 위에 남아 보이는 문제를 줄이기 위해 footer z-index를 올려 footer 구간에서는 sidebar가 덮이도록 조정했다.

## Open Questions

- 인기 주제 정렬을 고정 목록으로 둘지, 실제 문서 수/최근 업데이트 기준으로 바꿀지
- 향후 `/category`에 추천 문서 preview까지 추가할지 여부

## Next

- `/category/[main]`와 `/category/[main]/[sub]`도 같은 허브 톤으로 맞출지 검토
- category 카드별 대표 문서 수나 최신 문서 메타데이터를 함께 노출할지 검토
