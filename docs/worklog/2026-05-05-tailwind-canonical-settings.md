# Worklog: 2026-05-05 Tailwind Canonical Settings

## Summary

- workspace editor 설정에 Tailwind canonical class lint 기준을 추가
- class 표현 통일을 위해 canonical class와 variant order를 `error`로 승격
- CSS 파일이 Tailwind language mode로 열리도록 정리
- `apps/docs`의 최근 변경 화면을 기준으로 canonical form 1차 정리

## Changed

- `.vscode/settings.json`
- `apps/docs/app/category/page.tsx`
- `apps/docs/app/category/[main]/page.tsx`
- `apps/docs/app/category/[main]/[sub]/page.tsx`
- `apps/docs/entities/category/ui/category-document-card.tsx`
- `apps/docs/entities/category/ui/main-category-card.tsx`
- `apps/docs/entities/category/ui/sub-category-card.tsx`
- `apps/docs/entities/document/ui/main-card.tsx`
- `apps/docs/feature/search/ui/search.tsx`
- `apps/docs/app/docs/page.tsx`
- `apps/docs/app/docs/[slug]/page.tsx`
- `apps/docs/widgets/app-shell/ui/footer.tsx`
- `apps/docs/widgets/app-shell/ui/header.tsx`
- `apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx`
- `apps/docs/widgets/category-sidebar/ui/category-sidebar.tsx`
- `apps/docs/widgets/content-hub/ui/hub-page.tsx`
- `apps/docs/widgets/home-hero/ui/hero-section.tsx`
- `apps/docs/widgets/home-hero/ui/landing-box.tsx`
- `docs/runbooks/tailwind-canonical-form.md`
- `docs/worklog/2026-05-05-tailwind-canonical-settings.md`

## Notes

- 팀 기준이 "표현 통일 우선"이므로, Tailwind IntelliSense의 `suggestCanonicalClasses`를 단순 경고가 아니라 `error`로 보도록 맞췄다.
- 함께 `recommendedVariantOrder`도 `error`로 올려 class variant 순서까지 같은 기준으로 보게 했다.
- `cn`, `cva`, `cx` 함수 안에서도 Tailwind IntelliSense가 더 잘 동작하도록 class function 설정을 추가했다.
- CSS 파일은 Tailwind 전용 language mode로 열리게 해서 `@theme`, `@variant`, `@source` 같은 구문과 lint 경험을 더 일관되게 맞췄다.
- 1차 정리에서는 자동 정렬 도구 없이, 최근 변경된 `docs` UI 파일을 중심으로 정적 class 문자열을 canonical form에 맞게 직접 정리했다.
- `cn()`이 단일 문자열만 감싸는 경우는 plain `className`으로 바꿨고, 중복 유틸리티나 깨진 class 문자열도 함께 수정했다.
- 이어서 `docs` 쉘, 검색, 문서 카드, 카테고리 사이드바까지 범위를 넓혀 static-only `cn()` 래퍼를 더 제거했다.
- 남겨둔 `cn()`은 active state, theme branch, class merge처럼 실제 조합이 필요한 경우다.
- 후속으로 `aspect-[16/9]` -> `aspect-video`, `text-[0.75rem]` -> `text-xs`, `text-[1.125rem]` -> `text-lg`, `bg-[#09090b]` -> `bg-zinc-950` 같이 built-in과 정확히 대응되는 값은 추가 치환했다.
- 반대로 gradient, CSS variable, custom grid fraction, shell 고정 높이처럼 의도가 있는 arbitrary 값은 canonical form 예외로 문서에 명시했다.

## Open Questions

- Prettier 기반 class sorting까지 프로젝트 기본값으로 강제할지
- ESLint/CI 단계에서도 Tailwind 표현 규칙을 검사할지

## Next

- 실제 작업 중 canonical class 에러가 자주 뜨는 패턴이 있는지 관찰
- 필요하면 Tailwind class sorting 도구까지 팀 기본값으로 확장
