# 공용 shadcn 기본 컴포넌트 후속 반영

## Summary

[Sheet 옵션 반영](2026-09-21-sheet-close-button-upstream.md)에 이어 공식 Radix/new-york-v4 기준으로 Button, Badge, Tooltip 및 클라이언트 경계를 갱신했다. 기존 디자인 토큰과 기본 크기를 유지하며, 의존성 마이그레이션과 Activity 생명주기 문제는 별도 과제로 구분했다. 모든 upstream 코드를 덮어쓴 작업은 아니다.

## Changed

| 대상                          | 처리                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Button                        | 공식 `xs`, `icon-xs` 옵션 추가. 기존 크기와 variant는 유지                                 |
| Badge                         | 공식 `ghost`, `link` 변형과 `data-variant` 추가. 기존 outline의 토큰 스타일은 유지         |
| Tooltip                       | 내부 Provider 제거. 호출자가 제공한 Provider의 delayDuration을 따르도록 공식 구성으로 변경 |
| Tooltip·Collapsible·Separator | 공식과 같이 `use client` 경계 명시                                                         |
| Input·Skeleton                | import와 클래스 순서 외 확인한 기능 차이가 없어 유지                                       |
| Sidebar                       | 기존 상위 TooltipProvider와 맞춤 디자인 유지. 앞선 Sheet 옵션 변경도 유지                  |
| 의존성                        | cn·통합 radix-ui 전환, Base UI 교체, lockfile 갱신은 하지 않음                             |

`Tooltip`을 새로 사용할 때는 상위에 `TooltipProvider`가 필요하다. 저장소의 기존 사용처는 공용 Sidebar이며 이미 Provider를 제공한다. 테스트에서도 이 구성을 확인했다. 이 변경은 상위 지연 설정을 내부의 기본값 0이 덮어쓰던 문제를 없앤다.

Button의 작은 옵션은 선택적으로 사용할 수 있게 추가했으며, 실제 앱 버튼을 일괄 축소하지 않았다. `xs`는 24px 높이이므로 주요 모바일 조작에는 기존 크기 또는 충분한 클릭 영역을 사용한다. 테스트에서는 명시적 `size-11` 및 SVG 크기 재정의도 확인한다.

확인일은 2026-09-22이며 공식 main 소스는 이후 변경될 수 있다.

- [Button 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx)
- [Badge 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/badge.tsx)
- [Tooltip 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/tooltip.tsx)
- [Collapsible 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/collapsible.tsx)
- [Separator 소스](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/separator.tsx)
- [공식 변경 이력](https://ui.shadcn.com/docs/changelog)

## Notes

저장소 루트, mise의 Node 24 환경에서 실행했다.

```sh
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter docs test:activity-lab
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter @web-tech/ui exec eslint components/ui/button.tsx components/ui/badge.tsx components/ui/tooltip.tsx components/ui/collapsible.tsx components/ui/separator.tsx --max-warnings 0
mise exec -- pnpm --filter docs exec eslint ui-e2e playwright.ui.config.ts --max-warnings 0
```

- 새 공용 UI 검사 14개 통과: Chromium에서 light/dark 각각 7개. 실제 공유 Tailwind 토큰과 애니메이션 CSS를 컴파일하고, 공개 패키지 exports를 통해 컴포넌트를 사용한다.
- 기본 Button 36px, xs 24px, 명시적 44px 클릭 영역, disabled·키보드·asChild, Badge 색상·링크, Tooltip 지연·Escape·Sidebar 조합, Input·Collapsible·Separator를 확인했다.
- 최초 실행의 포인터 이탈 시나리오 2개는 실패했다. 한 번의 좌표 점프로는 Radix의 pointer grace 처리 후 닫힘을 관측하지 못했다. 여러 단계의 실제 이동 이벤트로 바꾼 뒤 통과했으며 고정 sleep이나 강제 클릭은 사용하지 않았다.
- 기존 Activity·Sheet 검사 22개 재실행 통과. 이 중 문제 동작을 재현하는 특성 검사는 여전히 포함된다.
- UI 빌드, 테스트 전용 타입 검사, UI·docs 타입 검사 및 변경 코드 lint 통과.

새 테스트는 `apps/docs/ui-e2e/`에 두어 Activity 실험과 분리했다. Playwright가 `ui.test` 응답을 로컬에서 제공하므로 NAS나 개발 서버는 필요 없다. 이 주소는 일반 브라우저용 개발 서버 주소가 아니다.

프로덕션 Next.js 빌드, 다른 소비 앱 전체 화면, Safari·Firefox, 스크린 리더는 이번에 검증하지 않았다. 공유 컴포넌트 책임을 새로 설계하거나 디자인 시스템을 교체한 것이 아니라 기존 Radix 구성의 공식 API를 맞춘 변경이므로 별도 ADR은 추가하지 않았다.

## Open Questions

### Activity·Portal이 별도 과제인 이유

Activity의 `hidden`은 화면 상태와 DOM을 보존하면서 Effect를 정리하는 동작이지, Dialog의 `open` 상태를 자동으로 닫는 동작이 아니다. 또한 Sheet의 Portal DOM은 일반 페이지 래퍼 바깥인 body에 만들어진다.

[기존 실험 결과](../../verification/content/2026-09-21-activity-focus.md)에서는 페이지 래퍼가 숨겨져도 Overlay가 남아 다음 화면의 클릭을 막았다. 같은 React commit에서 `open=false`와 `hidden`을 함께 적용해도 잔존했다. `showCloseButton`이나 스타일 갱신은 이 생명주기를 바꾸지 않는다.

비교 실험에서 통과한 방향은 보존할 본문만 Activity 안에 두고 Sheet의 Root·Content 생명주기는 밖에 두는 것이다. 화면을 떠날 때 명시적으로 닫고, 숨겨진 원래 trigger 대신 현재 보이는 합리적인 대상으로 포커스를 복귀시킨다. DOM의 `isConnected`만으로는 가시성과 포커스 가능 여부를 판정할 수 없다.

이는 해당 React/Radix 버전과 실험 구성의 관측이며 모든 Portal이 항상 남는다는 뜻은 아니다. 현재 docs 운영 코드에서 직접 작성한 Activity 사용처는 발견하지 못했다. 따라서 운영 메뉴에 임의의 지연이나 전역 포커스 강제를 추가하지 않았다.

실제 적용 전에는 production React, 실제 닫힘 애니메이션과 빠른 재열기, 라우트 전환, 모바일·reduced-motion, Safari·Firefox에서 Overlay 제거·스크롤 잠금 해제·포커스·재진입까지 검사해야 한다. 닫힘 완료 후 Activity를 숨기는 순차 방식도 비교 대상이며 아직 검증하지 않았다.

### cn·통합 radix-ui 전환을 분리하는 이유

공식은 cn 패키지와 통합 radix-ui import를 사용하지만 기존 로컬 cn도 여전히 유효하다. 이번에 그 두 의존성까지 바꾸면 시각/API 변경과 런타임 버전 변화의 원인을 구분하기 어렵다. 전환 시 패키지 버전·중복 Context·번들·SSR 경계·class 충돌 해소 결과를 별도로 비교해야 한다. import 경로를 바꾼다고 Activity 문제가 해결된다고 가정하지 않는다.

## Next

후속 작업과 완료 조건은 [공용 UI 백로그](../../todo/todo.md)의 Shared UI 절에 유지한다. 이전 Activity 검증 보고서와 원본 증거는 새 결과로 덮어쓰지 않는다.
