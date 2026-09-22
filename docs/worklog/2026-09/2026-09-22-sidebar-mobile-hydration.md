# Sidebar 모바일 판별을 shadcn 공식 구현으로 복원

## Summary

공용 UI의 모바일 판별 훅을 shadcn 공식 구현과 같은 초기화 방식으로 복원했다. 서버와 브라우저의 첫 렌더링에서는 false를 반환하고, mount 이후 실제 화면 크기를 반영한다.

## Changed

- [use-mobile 훅](../../../packages/ui/hooks/use-mobile.ts): 초기 상태를 undefined로 두고 effect에서 화면 크기를 읽는다. 기존 768px 기준과 matchMedia 구독 해제는 유지한다.
- [Sidebar hydration 테스트](../../../apps/docs/ui-e2e/sidebar-hydration.spec.ts): 실제 Sidebar의 서버 HTML을 브라우저에서 hydration한다. 390, 767, 768, 1280px와 breakpoint 전환, 모바일 Sheet 열기 및 Escape 닫기를 검사한다.
- recoverable hydration 오류를 pageerror로 전달하고 console error도 검사해, 화면만 정상으로 보이는 회귀를 놓치지 않도록 했다.
- [공식 원본](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/hooks/use-mobile.ts)의 동작을 유지한다. 저장소 lint 규칙에 대해서만 effect의 초기 상태 동기화 한 줄에 설명과 예외를 추가했다.
- 공개 API나 Base UI 선택은 바뀌지 않아 새 ADR은 추가하지 않는다. [기존 결정](../../architecture/adr-0006-shared-ui-base-ui.md)을 유지한다.

## Notes

2026-09-22, feature/docs 작업 트리에서 Node 24와 Chromium으로 검사했다. 저장소 루트에서 실행한다.

```sh
pnpm --filter @web-tech/ui lint
pnpm --filter @web-tech/ui typecheck
pnpm --filter docs test:ui
```

- 공용 UI lint와 타입 검사 통과.
- test:ui의 선행 UI 빌드 및 테스트 타입 검사 통과.
- 공용 UI 테스트 62개 통과. 신규 hydration 검사는 light/dark 프로젝트에서 각각 네 너비를 검사한 8개다. 신규 fixture는 스타일 평가가 아닌 React hydration 및 Sidebar 동작 검증이다.
- 최초 테스트 실행에서는 Playwright의 JSX 변환 때문에 서버 렌더링 fixture가 실패했다. 서버/브라우저 공용 fixture만 createElement를 사용하도록 변경한 뒤 재검사했다.
- 공식 방식은 mount 이후 상태 반영을 위한 추가 렌더링을 허용한다. 첫 렌더링에서 window를 읽도록 되돌리면 모바일에서 서버 HTML과 달라질 수 있다.
- 실제 Next.js 페이지, Safari/Firefox 및 배포 환경은 이번 검사 범위에 포함하지 않았다. 개발 서버를 새로 실행하지 않았다.

## Open Questions

없음. 이번 수정은 기존 반응형 동작의 hydration 안전성 보완이다.

## Next

실제 category 상세 페이지의 모바일 직접 진입에서도 hydration 오류가 없는지 후속 확인한다. 커밋과 푸시는 별도 요청 시 진행한다.
