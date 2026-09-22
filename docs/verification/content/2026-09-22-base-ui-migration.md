# Base UI 전환 검증

## 대상과 조건

- 날짜: 2026-09-22 KST.
- 대상: `feature/docs`, 기준 커밋 `242d81a` 위의 미커밋 Base UI 전환 코드.
- 환경: macOS, Node 24.12.0, pnpm 11.10.0, React 19.2.6, Next.js 16.3.4, Base UI 1.8.0, Playwright 1.62.1의 headless Chromium.
- 공용 UI는 실제 dist 빌드로 소비한다. UI·Activity·소비 앱 빌드를 순차 실행하여 dist 재생성 경합을 피한다.
- production 검사는 3115 포트의 별도 서버를 사용한다. NAS API·Better Stack 전송은 비활성화하며 기존 3001 개발 서버는 종료하지 않는다.

## 재현 방법

저장소 루트에서 실행한다. `test:ui:consumer`는 빌드 후 서버를 띄우고 종료한다. 환경은 저장소의 `apps/docs/playwright.ui-consumer.config.ts`에 명시돼 있다.

```sh
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter docs test:activity-lab
mise exec -- pnpm --filter docs test:ui:consumer
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter docs exec node scripts/measure-shared-ui-bundle.ts
```

변경 코드 lint 명령:

```sh
mise exec -- pnpm --filter @web-tech/ui exec eslint components/ui/badge.tsx components/ui/button.tsx components/ui/collapsible.tsx components/ui/separator.tsx components/ui/sheet.tsx components/ui/sidebar.tsx components/ui/tooltip.tsx lib/button-variants.ts lib/merge-ui-class-name.ts --max-warnings 0
mise exec -- pnpm --filter docs exec eslint activity-e2e/fixtures/activity-lab.tsx e2e/mobile-drawer-close.spec.ts ui-e2e/fixtures/primitives.tsx ui-e2e/primitives.spec.ts widgets/category-sidebar/ui/category-sidebar.tsx widgets/content-hub/ui/hub-topic-filters.tsx playwright.ui-consumer.config.ts scripts/measure-shared-ui-bundle.ts --max-warnings 0
```

## 결과와 증거

| 검사                         | 결과                        | 확인 범위                                                                                                                                                              |
| ---------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI fixture                   | 54 passed, 20.1초           | light/dark, cn 병합, 크기·아이콘, 키보드, render ref·이벤트 합성, 의도하지 않은 form submit 방지, 링크 역할, Tooltip 설명·취소·disabled, Sidebar·Collapsible·Separator |
| Activity fixture             | 22 passed, 12.9초           | 기본/StrictMode에서 DOM·Effect 보존, 포커스 복귀, Portal 잔존 특성                                                                                                     |
| Next.js production 소비 화면 | 16 passed, 빌드 포함 40.5초 | 모바일 Drawer 4조합, 한영·테마·모바일/데스크톱 필터, URL·새로고침·뒤로가기, 320px overflow                                                                             |
| 공용 UI·docs·vuln-radar 타입 | 통과                        | 전환 API 및 저장소 소비 코드                                                                                                                                           |
| docs·vuln-radar 빌드         | 통과                        | Next production test setup와 Vite build                                                                                                                                |
| 변경 코드 ESLint             | 통과                        | 위 명령의 파일만 검사                                                                                                                                                  |

첫 UI 실행은 36개 통과·10개 실패였다. variant 파일을 옮긴 뒤 Tailwind 스캔 경로가 빠져 SVG 크기가 0이 된 문제, Button에 넣은 anchor의 역할 변경, Tooltip 설명 관계 누락을 고쳤다. 최종 검사는 기대값을 완화하지 않고 회귀 항목을 추가해 통과했다.

Drawer는 사용자 닫기 버튼 한 개, Escape·배경 클릭, Tab 포커스 제한, trigger 복귀, Overlay 제거를 확인했다. 프로덕션 Web 필터 스크린샷에서 모바일 다크 테마의 토큰과 줄바꿈도 확인했다. 이미지와 실패 trace는 `apps/docs/test-results/ui-consumer/`에 생성되며 Git에 저장하지 않는다.

최종 UI fixture 번들은 minified 3,304,152 bytes, gzip 816,292 bytes였다. 기존 Radix 하위 경로 구성은 gzip 776,364 bytes였다. 이번 fixture에는 새 ref·Tooltip 제어·Sidebar 링크 사례도 더해졌으므로 차이 전체를 라이브러리 비용이라고 볼 수 없다. 추가 사례를 넣기 전 전환 중 측정에서도 gzip 815,900 bytes로 증가했다. 둘 다 실제 Next.js 경로의 전송 크기·실행 성능을 의미하지 않는다. 측정 스크립트는 현재 checkout의 값만 재현한다.

1차 fixture에서 직접 Radix primitive나 통합 CommonJS 루트 import는 관측되지 않았다. 당시 다른 앱의 Slot, 아이콘과 cmdk는 남아 있었으며 아래 후속 작업에서 정리했다. lockfile에는 Base UI 추가 및 미사용 Radix 제거 외에도 공유 Floating UI 전이 버전 갱신이 포함된다.

### 잔여 의존성 정리 검증 (같은 날 후속 실행)

다음 명령으로 manifest뿐 아니라 실제 전이 경로를 확인했다.

```sh
mise exec -- pnpm -r why @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-toggle cmdk @radix-ui/react-icons
mise exec -- pnpm install --no-frozen-lockfile
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm validate:catalog
```

- 미사용 직접 의존성 세 개와 catalog를 제거한 후 설치 패키지 22개가 정리됐다. frozen install과 11개 manifest의 catalog 검사 통과.
- 현재 앱·패키지 manifest와 catalog에 Radix·cmdk 직접 선언은 없다. cmdk·Radix Dialog·Radix 아이콘 경로도 더 이상 조회되지 않는다.
- 남은 경로는 `prisma@7.8.0 -> @prisma/studio-core@0.27.3 -> @radix-ui/react-toggle@1.1.10 -> @radix-ui/react-primitive -> @radix-ui/react-slot@1.2.3`이다. docs의 better-auth 경로와 vuln-radar-backend의 Prisma 경로에 걸려 있다. lockfile 존재를 브라우저 번들 포함으로 단정하지 않으며 포함 여부는 미검증이다.
- UI 54개 재검사 통과(24.4초). 첫 production 재검사는 15개 통과·1개 실패였고, light/reduce에서 Tab 직후 내부 포커스 동기 assertion이 실패했다.
- 설치된 Base UI 1.8.0의 `FloatingFocusManager`와 `enqueueFocus`를 확인했다. 모달 경계 guard는 `requestAnimationFrame`에서 첫/마지막 요소로 복귀시킨다. 테스트는 인접 guard 이외 배경 포커스를 즉시 실패시키고, guard를 거쳐도 1초 안에 내부로 복귀해야 통과하도록 수정했다.
- 수정 후 전체 production 검사 16개 통과(37.2초). light/dark·reduced-motion 조합에서 Tab·Shift+Tab 각각 15회와 닫기·복귀를 검증했다.
- Drawer 4조합을 각각 5회 반복하여 20개 통과(58.9초). 공용 UI·docs·vuln-radar 타입 검사, vuln-radar 빌드, 수정한 Drawer 테스트 ESLint도 다시 통과했다. Activity 검사와 번들 측정은 이 후속 단계에서 재실행하지 않았다.

반복 검사 명령:

```sh
mise exec -- pnpm --filter docs test:ui:consumer e2e/mobile-drawer-close.spec.ts --project=chromium-mobile --repeat-each=5
mise exec -- pnpm --filter docs exec eslint e2e/mobile-drawer-close.spec.ts --max-warnings 0
```

## 한계와 후속 작업

### PR 분리 후 재검증

2026-09-22 KST, `codex/blog-updates`에서 `1a2e041`에 공용 UI 커밋 `2212a90`을 병합한 작업 트리를 검사했다. 충돌 해결 후 앱·패키지·lockfile·CI·스크립트는 `1a2e041`과 동일하며 공용 UI 패키지와 독립 UI fixture는 `2212a90`과 동일함을 git diff로 확인했다.

`mise exec -- pnpm install --ignore-scripts --frozen-lockfile` 통과, `mise exec -- pnpm --filter docs test:ui:consumer`는 production 빌드 포함 16개 통과(55.4초). 비예제 .env 파일과 명백한 토큰·개인 키 패턴은 PR diff 검사에서 발견하지 못했다. 이는 제한된 패턴 검사이며 보안 보증이나 전체 히스토리 감사가 아니다.

블로그 PR은 장기간 누적된 화면·콘텐츠·문서 정책·관련 CI 변경을 포함한다. 이번 재검사에서 전체 과거 변경의 모든 테스트를 재실행하지는 않았으므로 draft로 준비하고 CI 및 리뷰 후 병합한다.

아래 한계는 후속 정리 이후에도 유지된다.

- Activity의 열린 Sheet를 숨기면 Portal이 남는 테스트는 그 현상을 기대값으로 기록한다. 22개 통과가 결함 해결을 뜻하지 않는다.
- production Tooltip, Safari·Firefox, 실제 모바일 기기·스크린 리더, Vercel 배포·NAS 연동은 미검증이다.
- 모든 Sheet 방향이나 Base UI의 detached handle·다중 trigger까지 검사한 것은 아니다. 공용 Tooltip은 단일 trigger 범위다.
- vuln-radar 빌드에는 기존 Vite native config loader 관련 import 확장자 경고가 남아 있다. 이번 변경 때문에 생긴 실패는 아니다.
- 실제 서비스 성능 우위를 주장하려면 동일 경로의 빌드 산출물과 사용자 성능을 별도로 비교해야 한다.

## 관련 문서

- [ADR-0006](../../architecture/adr-0006-shared-ui-base-ui.md)
- [이번 작업 기록](../../worklog/2026-09/2026-09-22-base-ui-migration.md)
- [Radix 기준선](../../worklog/2026-09/2026-09-22-ui-dependency-migration.md)
- [이전 Activity 실험](2026-09-21-activity-focus.md)
