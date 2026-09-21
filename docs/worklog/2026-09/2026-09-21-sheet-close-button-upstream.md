# 공식 Sheet 닫기 버튼 옵션 반영

## Summary

[공용 UI 점검](2026-09-21-shadcn-upstream-audit.md)의 첫 단계로 공식 shadcn Radix Sheet의 `showCloseButton` 옵션을 반영했다. 기존 디자인 토큰과 공개 exports는 유지하고, 모바일 메뉴와 Sidebar의 버튼 숨김 CSS를 명시적 API로 교체했다.

## Changed

- `SheetContent`에 `showCloseButton?: boolean`을 추가했다. 기본값은 `true`이므로 기존 사용처의 닫기 버튼은 그대로 유지된다.
- docs 모바일 메뉴와 공용 Sidebar에 `showCloseButton={false}`를 지정하고 `[&>button]:hidden`을 제거했다. 사용자 정의 버튼까지 숨기는 직접 자식 선택자에 의존하지 않는다.
- Activity 실험에 기본 옵션, 사용자 정의 닫기, 키보드 탐색 및 포커스 복귀 검사를 추가했다.
- 실제 docs 모바일 메뉴에 라이트·다크 모드와 reduced-motion 설정별 닫기 회귀 검사를 추가했다.

기준은 2026-09-21에 확인한 [공식 Radix Sheet 문서](https://ui.shadcn.com/docs/components/radix/sheet)와 [new-york-v4 Sheet 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sheet.tsx)다. main 소스는 이후 변경될 수 있다. 이번 변경은 해당 옵션의 선별 반영이며, 전체 upstream 구현의 동기화가 아니다.

## Notes

저장소 루트에서 Node.js 24 환경으로 다음 검사를 실행했다.

```sh
mise exec -- pnpm --filter docs test:activity-lab
mise exec -- pnpm --filter docs exec playwright test e2e/mobile-drawer-close.spec.ts --project=chromium-mobile --workers=1
mise exec -- pnpm --filter docs exec eslint activity-e2e e2e/mobile-drawer-close.spec.ts widgets/app-shell/ui/mobile-nav-drawer.tsx --max-warnings 0
mise exec -- pnpm --filter @web-tech/ui exec eslint components/ui/sheet.tsx components/ui/sidebar.tsx --max-warnings 0
mise exec -- pnpm --filter docs typecheck
```

- Activity 실험 22개 통과: 기존 16개와 새 API 검사 6개. StrictMode 활성화 여부를 각각 검사했다. 실행 전 공용 UI 빌드와 실험 전용 타입 검사도 통과했다.
- 실제 모바일 메뉴 4개 통과: light/dark와 no-preference/reduce 조합에서 사용자 정의 닫기 버튼 하나만 표시되고, 클릭 및 Escape 닫기 후 overlay 제거와 트리거 포커스 복귀를 확인했다.
- 변경 코드 lint와 docs 타입 검사 통과.

실제 메뉴 검사는 기존 로컬 개발 서버를 사용했다. 프로덕션 빌드 및 Safari·Firefox 검사는 이번 범위에 포함하지 않았다. 공용 Sidebar 자체의 화면 검증은 하지 않았으며, 공용 Sheet API와 docs 소비 화면을 검사했다.

Activity 실험의 기존 Portal 잔존 문제는 여전히 재현되는 특성 검사다. 22개 통과를 해당 문제의 해결로 해석하지 않는다. 의존성, lockfile, 로컬 cn 구현, Radix import 방식은 변경하지 않았다.

## Open Questions

공용 Sidebar를 소비하는 다른 앱의 실제 모바일 화면과 브라우저별 동작은 추가 점검 대상이다. Activity와 Portal의 생명주기 분리는 이번 닫기 버튼 API 갱신과 별개로 다룬다.

## Next

1. 공용 UI를 추가 갱신할 때 이 회귀 검사를 유지한다.
2. Button 크기 옵션은 실제 사용처가 필요할 때 검토한다.
3. cn 및 radix-ui 통합 import 전환은 의존성 변경과 소비 앱 검증을 포함한 별도 작업으로 진행한다.
