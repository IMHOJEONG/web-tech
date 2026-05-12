# 2026-05-08 About 문의 구역 제거

## 요약

- About 페이지에서 `INITIATE CONTACT` 섹션을 제거했다.
- 현재 HeapForge는 직접 문의 접수 흐름을 열지 않을 계획이므로, 더 이상 쓰지 않는 `contact-form` client component도 삭제했다.
- 하단 영역이 어색하게 비지 않도록, 남은 creator/profile 카드를 단일 컬럼 구도로 다시 정렬했다.
- contact form이 존재한다고 가정하던 i18n 문구와 체크리스트 항목도 함께 정리했다.

## 파일

- `apps/docs/widgets/about-us/ui/about-us.tsx`
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/todo/platform-improvement-todo.md`
- `docs/architecture/docs-heapforge-alignment-checklist.md`
