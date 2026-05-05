# Worklog: 2026-05-05 Docs Next Intl Policy

## Summary

- `apps/docs`의 app shell 기준 UI 문자열을 `next-intl`로 통일
- `Brand`, navigation, drawer, `Footer`, `Search`를 메시지 파일에 연결
- 메시지 키 네이밍 규칙과 namespace 기준을 문서화

## Changed

- `apps/docs/shared/ui/brand.tsx`
- `apps/docs/widgets/app-shell/ui/navigation.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-bottom-nav.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx`
- `apps/docs/widgets/app-shell/ui/footer.tsx`
- `apps/docs/feature/search/ui/search.tsx`
- `apps/docs/feature/search/empty-search-result.tsx`
- `apps/docs/shared/message/ko.json`
- `apps/docs/shared/message/en.json`
- `docs/architecture/docs-next-intl-usage-policy.md`
- `docs/todo/platform-improvement-todo.md`

## Notes

- 이번 작업은 page-level 긴 카피보다 app shell과 공용 인터랙션 문구를 먼저 정리하는 데 초점을 두었다.
- 메시지 키는 `common / navigation / header / footer / search` namespace와 camelCase 규칙으로 정리했다.
- 후속 작업에서는 `docs-index`, `about-us`, `article-detail` 같은 화면 단위 copy도 같은 규칙으로 확장할 수 있다.
