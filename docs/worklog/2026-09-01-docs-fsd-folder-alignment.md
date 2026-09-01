# Docs FSD Folder Alignment

## Context

`feature/docs` 브랜치로 돌아온 뒤, `docs` 앱의 FSD 문서와 실제 폴더 구조가 다시 어긋난 부분을 점검했다.

## Changes

- font 정의를 `apps/docs/shared/config/fonts.ts`로 모았다.
- `app/layout.tsx`의 font import 경로를 새 config 경로로 변경했다.
- import되지 않는 빈 legacy category 컴포넌트를 제거했다.
- `docs-app-fsd.md`에 6차 정리 결과를 추가했다.
- `todo.md`의 FSD 폴더 구조 재점검 항목을 완료 처리했다.

## Reasoning

폰트 설정은 화면 조합 UI가 아니라 앱 전역 config에 가깝다.
따라서 `components`에 두면 FSD 기준이 흐려지고, 새 코드가 다시 legacy `components` 폴더로 들어갈 여지를 만든다.

빈 category 컴포넌트는 이미 `entities/category/ui`로 대체되어 있었고 실제 import도 없었기 때문에 제거하는 편이 안전하다.
