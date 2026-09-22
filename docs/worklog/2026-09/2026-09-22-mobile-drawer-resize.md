# 화면 전환 후 모바일 메뉴 오버레이 잔류 수정

## Summary

모바일 메뉴를 연 채 화면을 넓히면 패널은 숨겨지지만 overlay와 스크롤 잠금이 남던 문제를 수정했다. 표시를 숨기는 것과 실제 닫힘 상태를 일치시켰다.

## Changed

- [MobileNavDrawer](../../../apps/docs/widgets/app-shell/ui/mobile-nav-drawer.tsx)가 app shell의 40rem 경계 전환을 구독하고 desktop 진입 시 열린 상태를 초기화한다. 모바일 복귀 시 자동 재열기는 하지 않는다.
- 공용 Sheet 및 use-mobile 훅은 변경하지 않는다. 초기 상태는 닫힘이며 effect는 미디어 쿼리 이벤트 구독과 정리만 수행한다.
- [반응형 정책](../../architecture/docs-responsive-policy.md)에 동작 기준을 추가했다. 기존 sm 기준을 구현하는 오류 수정이므로 새 ADR은 필요하지 않다.
- [회귀 테스트](../../../apps/docs/e2e/mobile-drawer-resize.spec.ts)에 639/640px 경계와 390x844 → 844x390 → 390x844 전환을 추가했다.

## Notes

2026-09-22, feature/docs의 Node 24와 기존 로컬 개발 서버, Chromium에서 검증했다.

```sh
pnpm --filter docs test:e2e mobile-drawer-resize.spec.ts --project=chromium-mobile --grep light/no-preference --max-failures=1
pnpm --filter docs test:e2e mobile-drawer-resize.spec.ts mobile-drawer-close.spec.ts --project=chromium-mobile --workers=1 --max-failures=1
pnpm --filter docs exec eslint widgets/app-shell/ui/mobile-nav-drawer.tsx e2e/mobile-drawer-resize.spec.ts --max-warnings 0
pnpm --filter docs exec tsc --noEmit --incremental false
```

- 첫 번째 명령으로 수정 전 overlay가 기대값 0이 아닌 1개 남아 실패하는 것을 재현했다.
- 수정 후 기존 닫기 검사 4개와 신규 화면 전환 검사 4개, 총 8개 통과. light/dark 및 reduced-motion 설정 두 가지를 각각 확인했다.
- 경계 이탈 후 overlay 제거, wheel 스크롤 복구, desktop 링크 포커스 가능, 모바일 복귀 후 재열기, Escape 닫기 및 trigger 포커스 복귀를 확인했다.
- 전체 docs 타입 검사와 변경 파일 lint 통과.
- Safari/Firefox 및 실제 기기 회전, 운영 재배포 후 검사는 별도다. viewport 변경 검사를 실제 기기 검증으로 간주하지 않는다.

## Open Questions

없음. app shell breakpoint를 바꾸면 CSS와 미디어 쿼리, 회귀 테스트의 경계값을 함께 갱신해야 한다.

## Next

배포 후 모바일 메뉴를 연 상태에서 화면을 회전해 overlay와 스크롤 잠금이 남지 않는지 확인한다.
