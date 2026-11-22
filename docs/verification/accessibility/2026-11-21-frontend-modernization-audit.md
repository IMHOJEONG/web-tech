# 프런트엔드 현대화 후보 검증과 실행 제안

## 대상과 조건

- 검토일: 2026-11-21 KST. 최초 감사는 제품 코드 수정 전이며, 사용자 승인 후 같은 날 아래 후속 적용·검증을 완료했다.
- 기준: `feature/modern-web-guidance`, HEAD `c6465f48c96aef681a42de77a584b25e69fd8525`와 기존 미커밋 작업 트리. HEAD만 검사한 결과가 아니다.
- 추적: [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83). 기존 JavaScript 적용 작업과 이번 프런트엔드 계획을 구분한다.
- 도구: Modern Web Guidance CLI 1.0.1, Node 24.22.1, 설치된 Tailwind PostCSS 4.2.4, Playwright 1.62.1·Chromium 151.0.7922.34.
- 범위: 루트·`apps`·`packages` 결정적 패턴 스캔과 docs·vuln-radar·공용 UI의 모달, 목차, 폼, 모션, 이미지에 대한 추가 소스 검토. 콘텐츠 원고·서버 로직의 전수 수동 감사는 아니다.
- 브라우저 검증: 원본 클래스와 실제 앱 CSS를 컴파일한 독립 합성 DOM, 1280×800. React 전체 컴포넌트·라우트·실기기 검증과 다르다.
- 앱·패키지의 TS/JS/TSX/JSX/CSS/SCSS/HTML 690개 파일 해시를 검사 전후 대조한다. 이는 수동 검토 파일 수가 아니다.

## 재현 방법

저장소 루트에서 다음 명령을 실행했다. CLI 설치는 네트워크 권한이 필요하다.

```sh
pnpx modern-web-guidance@latest --version
pnpx modern-web-guidance@latest legacy-scan . --json
pnpx modern-web-guidance@latest legacy-scan apps --json
pnpx modern-web-guidance@latest legacy-scan packages --json
pnpx modern-web-guidance@latest list
pnpx modern-web-guidance@latest search "respect reduced motion" --skill-version 2026_11_10-47b4c80e
pnpx modern-web-guidance@latest search "prioritize responsive images" --skill-version 2026_11_10-47b4c80e
pnpx modern-web-guidance@latest retrieve js,scrollspy,dialog,navigation-drawer,responsive-design,accessibility,forms
pnpx modern-web-guidance@latest retrieve motion,optimize-image-priority
```

`@latest`는 이번에 1.0.1로 해석됐다. 같은 스캐너의 재현에는 `modern-web-guidance@1.0.1`을 사용하고, 최신 가이드로 재평가할 때에는 결과 버전을 다시 기록한다.

브라우저 관측은 저장소를 수정하지 않는 임시 Node 실행으로 수행했다. 재현 절차:

1. `feed-filter-bar.tsx`의 input class, 공용 `skeleton.tsx` class, `sidebar.tsx`의 `sidebar-gap`·`sidebar-container` 기본 class를 원본에서 추출한다.
2. 설치된 `postcss`와 `@tailwindcss/postcss`로 vuln-radar·docs의 실제 `global.css`를 각각 컴파일한다. 클래스 이름만 보고 최종 CSS를 추정하지 않는다.
3. Chromium의 독립 DOM에 컴파일한 CSS와 해당 클래스를 넣는다. 검색 입력의 Tab 포커스 및 `forcedColors: active`의 전후 계산값을 비교한다.
4. `reducedMotion: reduce`에서 Skeleton·Sidebar의 animation/transition 계산값을 수집하고 브라우저를 종료한다.

최초 Chromium 실행은 샌드박스의 Mach port 권한으로 실패했다. 승인된 동일 목적의 실행에서 관측을 완료했다. 이 초기 실패를 제품 실패로 집계하지 않는다. 원시 실행 로그와 임시 harness는 공개 자료에 복제하지 않는다.

## 결과와 증거

[정제 관측 요약](../artifacts/2026-11-21-frontend-modernization-audit.json)에 수치·판정과 검증 범위를 연결한다.

### 자동 스캔과 제외 판정

| 범위        | 결과        | 해석                                    |
| ----------- | ----------- | --------------------------------------- |
| 저장소 루트 | 5건, 종료 0 | 모두 scripts 경로. 실제 교체 대상은 0건 |
| apps        | 0건, 종료 0 | 결정적 규칙으로 잡히는 패턴 없음        |
| packages    | 0건, 종료 0 | 결정적 규칙으로 잡히는 패턴 없음        |

각 스캔은 38개 가이드·52개 결정적 규칙, 전체 가이드의 약 20%를 검사한다. 실행이 겹치므로 결과를 더하지 않으며, 탐지 0건을 접근성·성능·현대화 완료로 해석하지 않는다.

| 파일·줄                                            | 자동 후보            | 검증한 제외 사유                                                                  |
| -------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `scripts/analyze-vuln-radar-lockfile.mts:116`      | 복사 후 sort         | `targets`는 Set. rubric의 non-Array iterable 제외에 해당하며 배열 변환이 필요하다 |
| `scripts/verify-modern-javascript-guidance.mjs:77` | 복사 후 sort         | toSorted 결과와 이전 방식의 의미를 대조하는 의도적 비교 기준                      |
| 같은 파일 `:103`                                   | slice 후 sort        | sparse hole 보존과 toSorted의 차이를 확인하는 의도적 검증                         |
| 같은 파일 `:105`                                   | spread 후 sort       | sparse 배열의 밀집화를 비교하는 의도적 검증                                       |
| 같은 파일 `:126`                                   | 외부 resolve Promise | executor의 동기 실행을 확인하는 비교 fixture. 제품의 비동기 gate가 아님           |

### 추가 검토로 확인한 개선 후보

| 순서 | 위치                                                  | 확인 결과                                                      | 제안과 영향                                                                                                                                                                                                   |
| ---- | ----------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `packages/ui/components/ui/sidebar.tsx:225,236`       | reduce에서도 width 및 left/right/width 전환이 0.2초 유지       | `motion-safe`로 공간 이동을 허용한 경우에만 적용. category layout의 실제 소비 경로가 있으며 키보드 단축키로 상태가 바뀐다                                                                                     |
| 2    | `packages/ui/components/ui/skeleton.tsx:7`            | reduce에서도 pulse가 2초 주기로 설정됨                         | 기본 정적 Skeleton에 `motion-safe:animate-pulse` 적용. 공개 export와 SidebarMenuSkeleton 내부 소비는 있으나 현재 앱에서 해당 Skeleton의 직접 렌더링 경로는 발견하지 못했으므로 패키지 계약 예방 개선으로 분류 |
| 3    | `apps/docs/shared/ui/document-thumbnail.tsx:18,35,72` | Next Image의 deprecated `priority`를 타입·기본값·전달부에 유지 | 현재 호출부는 모두 priority를 생략한다. 불필요한 wrapper prop을 제거하거나 실제 사용 목적에 맞는 명시적 prop으로 전환하되 lazy 기본값을 보존                                                                  |

위 모션 항목은 조회한 `motion` 가이드의 no-preference opt-in 원칙을 적용할 후보다. Skeleton은 `aria-hidden`·로딩 상태의 책임까지 이번에 변경할 근거는 없다. 공간을 차지하는 Sidebar gap의 width 전환은 주변 레이아웃을 바꾸므로 transform으로 기계적으로 치환하지 않는다. 성능 병목으로 측정된 것은 아니다.

이미지 API 폐기는 설치된 `apps/docs/node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`와 [공식 Next Image 문서](https://nextjs.org/docs/app/api-reference/components/image#priority)에서 교차 확인했다. LCP 이미지가 무엇인지는 측정하지 않았으므로 모든 썸네일에 preload·eager·high priority를 붙이는 제안은 하지 않는다.

### 유지·선택·보류 항목

- **검색 포커스: 선택 개선.** vuln-radar 입력은 outline이 없고 그림자에 의존하는 부분이 있다. forced colors에서 그림자는 none이 됐지만, UA가 blur/focus의 borderColor를 다르게 표시했다. 따라서 포커스 완전 소실이라는 결함 판정은 제외한다. 명시적 `focus-visible` outline과 `Highlight` 색은 추가 브라우저·OS 비교 후 채택할 수 있다. [MDN 강제 색상 처리](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors).
- **목차: 현행 유지.** `use-active-heading.ts`는 resize에서 위치를 측정하고 passive scroll+rAF로 갱신하며 정리 코드가 있다. native `scroll-target-group`·`:target-current`는 가이드상 브라우저 지원이 제한되므로, 실험하더라도 기능 감지·현행 fallback·aria-current·맨 아래 항목 선택을 보존해야 한다. 이중 경로의 이익은 아직 측정하지 않았다.
- **모달·툴팁: 현행 유지.** Sheet·Tooltip은 Base UI 기반이며 포커스·제어 상태·SSR 계약을 가진다. native dialog/popover로의 일괄 교체는 이번 결함 수정에 필요하지 않다. 이미 Sheet·Tooltip의 공간 전환에는 motion-reduce 처리가 있다.
- **뉴스레터: 사용 전 보완.** placeholder만 있는 input과 동작 없는 button은 `ArticleDetail` 예시 트리에 있으나 현재 route로 이어지는 소비 경로를 찾지 못했다. 실제 구독 기능 추가 없이 폼을 임의로 연결하지 않는다. 재사용 시 label·email/autocomplete·제출/오류 계약을 먼저 정한다.
- **Column: 사용 전 보완.** `packages/ui/layout/Column.tsx`의 100vw/100vh는 현재 앱 소비와 package exports 경로가 없다. 모바일 사용자 결함으로 집계하지 않고, 다시 노출할 때 부모 폭·svh/dvh 선택을 검토한다.

### 구현 제안과 완료 조건

아래 단계는 제안이며 이번 실행에서 제품 소스를 변경하지 않았다.

1. **공용 모션 경계 정리:** Sidebar의 두 공간 전환과 Skeleton pulse에 no-preference 조건을 적용한다. 색상 피드백은 유지한다. 정상·reduce 각각의 열린/닫힌 최종 상태, 단축키, 포커스, 모바일 Sheet를 검사한다. transitionend 대기 코드가 없는 현재 계약도 대조한다.
2. **썸네일 API 정리:** 모든 호출부가 기본 lazy 동작을 유지하도록 deprecated priority 계약을 정리한다. `sizes`, 이미지 실패 fallback, alt와 레이아웃 크기를 보존한다. 대표 목록의 실제 img loading·preload 개수·실패 경로를 비교한다. LCP priority 조정은 실제 라우트별 측정을 한 뒤 별도 결정한다.
3. **소비 경로 회귀와 재스캔:** 먼저 `pnpm --filter @web-tech/ui typecheck`, `pnpm --filter @web-tech/ui lint`, `pnpm --filter docs typecheck`, `pnpm --filter docs lint`를 수행한다. 기존 docs 공용 primitive·category·이미지 관련 브라우저 검사 중 변경된 계약을 확인하는 범위만 실행하고 Chrome·Firefox·Safari 및 390/768/1280px에서 normal/reduce를 대조한다. 변경 파일의 legacy-scan을 다시 실행하되 의도적 fallback·검증 fixture를 0건 맞추기로 제거하지 않는다.
4. **선택 개선 검토:** Vuln Radar outline·검색 landmark/input 힌트, 카드 hover 모션을 별도 소비 경로와 실제 브라우저에서 확인한다. native 목차·dialog 전환은 필요성과 이익을 입증하기 전까지 보류한다.

공통 브라우저 정책을 임의로 강화하거나 새 polyfill·런타임 의존성을 추가할 필요는 현재 확인하지 못했다. Chrome·Safari·Firefox 최신 stable 및 모바일 QA 기준을 유지한다. 공개 컴포넌트 책임·데이터 흐름·라우팅을 바꾸는 결정이 없어 이번 감사의 새 ADR은 만들지 않는다.

## 한계와 후속 작업

아래 목록은 최초 감사 시점의 범위다. 같은 날 후속 적용에서 수행한 검사는 다음 절로 구분한다.

- 이번 결과는 코드 검토와 실제 CSS의 합성 관측이다. 앱 전체 E2E·빌드·전체 타입/린트·Lighthouse·LCP/INP/CLS 성능 측정은 실행하지 않았다.
- 다른 브라우저 엔진·모바일 주소창/키보드·OS 고대비·스크린리더·실제 독자 흐름은 미검증이다.
- CLI가 제외하는 문서·테스트·생성물과 결정적 규칙 밖의 모든 패턴을 감사한 것은 아니다. 콘텐츠 HTML 보안 정책을 변경하거나 완전한 보안 감사를 수행하지 않았다.
- 기존 사용자 소스 변경·스테이징 상태를 유지하고 이번 계획 문서·정제 증거·목차·worklog만 추가한다. 코드 적용·커밋·푸시·PR·main·배포 완료를 뜻하지 않는다.
- 이번 문서 6개의 Prettier 검사와 작업 트리 view의 문서 검증은 통과했다. 문서 오류 0개, 소스 690개 해시 동일, 인덱스는 기존 빈 상태다. staged 전용 검사로 미추적 문서 검증을 대신하지 않았다.

## 사용자 승인 후 실제 적용·검증

### 설치와 실행 확인

사용자가 권장 계획의 실제 적용을 요청했다. 프로젝트 스킬은 `.agents/skills/modern-web-guidance/SKILL.md`에 설치돼 있고 `skills-lock.json`은 공식 `GoogleChrome/modern-web-guidance`의 커밋 `64a6d708f5a43f2cd3fde5d4d7db3905ba1bdf65`를 기록한다. 이 세션에서 `pnpx modern-web-guidance@latest --version`의 1.0.1과 motion·image 질의의 검색/조회를 실제 실행했다. CLI는 pnpx 도구 캐시에서 실행하며 앱 package.json·lockfile·런타임 의존성에 추가하지 않았다. 설치가 존재한다는 사실과 이번에 새로 설치·원격 반영했다는 주장은 구분한다.

### 변경 내용

- `packages/ui/components/ui/sidebar.tsx`: 폭·위치뿐 아니라 내부 메뉴의 크기·여백·transform 전환도 `motion-safe`로 제한했다. label의 opacity·rail의 색상 피드백은 유지한다. 단순 버튼 회전은 Motion 컴포넌트에서 CSS로 옮겨 정상 설정의 1초 회전·최종 방향을 유지했다. 이 파일의 Motion import만 제거했으며 패키지 의존성을 삭제하지 않았다.
- `packages/ui/components/ui/skeleton.tsx`: pulse를 `motion-safe:animate-pulse`로 제한해 기본 정적 상태를 제공한다.
- `apps/docs/shared/ui/document-thumbnail.tsx`: 소비자가 사용하지 않는 priority 타입·기본값·전달을 제거했다. preload·fetchPriority를 대신 추가하지 않고 Next Image 기본 lazy 로딩과 기존 sizes·alt·실패 fallback을 유지한다.

전환 속성만 조건부로 만들고 `duration-200`을 무조건 남기면 초기 `transition-property: all`과 조합해 reduce에서도 공간 전환이 실행될 수 있다. 본체의 duration도 같은 조건으로 제한했다. 폭으로 주변 공간을 확보하는 계약은 유지했고 transform으로 기계적으로 바꾸지 않았다. 이 적용은 기존 정책의 보완이며 새 라우팅·데이터 흐름·공용 컴포넌트 책임 결정이 없어 ADR을 추가하지 않는다.

### 실행과 결과

```sh
pnpm --filter @web-tech/ui build
pnpm --filter @web-tech/ui typecheck
pnpm --filter @web-tech/ui lint
pnpm --filter docs typecheck
pnpm --filter docs lint
pnpm --filter docs exec playwright test --config=playwright.ui.config.ts primitives.spec.ts sidebar-hydration.spec.ts
pnpx modern-web-guidance@latest legacy-scan packages/ui/components/ui --json
pnpx modern-web-guidance@latest legacy-scan apps/docs/shared/ui --json
```

| 항목                                              | 결과               | 범위                                                                                                                                   |
| ------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 공용 UI build·typecheck·lint, docs typecheck·lint | 통과               | 기존 workspace 명령, 최종 소스 기준                                                                                                    |
| 기존 primitive·hydration 회귀                     | 32개 통과          | light/dark·키보드·툴팁·공개 렌더 계약·390/767/768/1280px SSR 및 모바일 Escape                                                          |
| 앞선 공용 UI suite                                | 68개 통과          | 중간 소스의 tarball 소비·대비·cn 등을 포함. 최종 duration 조건 보완 뒤 관련 32개를 재검사했으며 같은 결과로 합산하지 않음              |
| 실제 컴포넌트 변경 전후 비교                      | 18조건·36실행 통과 | Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5 × 390/768/1280px × normal/reduce × 변경 전/후                                         |
| 이미지 계약                                       | 18조건 모두 동일   | 실제 DocumentThumbnail·공식 Next Image ESM 구현, 성공·실패→fallback·fallback 실패→이미지 제거, lazy·sizes·alt·192×128 크기·preload 0개 |
| reduce 모션                                       | 세 엔진 모두 확인  | 본체 공간 전환 0초, 메뉴 크기 전환 0초, trigger 회전 전환 0초, Skeleton animation none·실행 0개. label opacity는 유지                  |
| 변경 범위 스캔                                    | 두 범위 0건        | 자동 규칙의 제한은 최초 감사와 같음                                                                                                    |

18조건 비교는 임시 Node harness에서 실제 원본 컴포넌트를 esbuild로 번들하고 앱 CSS를 컴파일해 수행했다. 이전 소스는 편집 전에 별도 보존한 bytes를 번들 입력으로 사용했다. Next 앱 서버가 제공하는 환경 주입과 모듈 상호운용을 재현하기 위해 공개 ESM Image 진입점과 비밀값 없는 build-time 환경을 사용했다. 외부 네트워크 요청 대신 성공/404의 합성 이미지 응답을 제공했다. API 서버·실제 콘텐츠·인증·Next 전체 라우트의 운영 검증은 아니다.

초기 harness 실패는 제품과 구분한다. Next의 환경 주입 누락·CJS 기본 export 상호운용 문제를 보완했고, 작은 합성 이미지의 srcset 밀도 보정으로 자연 폭이 0이 되는 검증 입력을 256px 이미지와 양수 디코딩 검사로 정정했다. 기존 Motion의 무회전 `none`과 새 CSS의 항등 행렬은 동일한 최종 방향으로 비교했다. 성공/실패 경로·크기·키보드·포커스·reduce 조건은 유지했다. 반복 실행의 실패 결과를 최종 성공으로 덮어 해석하지 않는다.

구현 전 보존한 기존 파일 2,339개 중 제품 소스 변경은 위 3개뿐이다. 그 밖의 기존 사용자 파일·package/lockfile·공통 AGENTS와 인덱스는 보존한다. 결과 artifact의 implementation 항목에 최종 해시와 관측 요약을 연결한다. 새 영구 테스트 파일은 추가하지 않았으며 기존 동작 회귀와 임시 실제 소비 검증으로 확인했다.

최종 확인에서 소스 3개·문서 6개의 의도한 9파일만 변경됐고 다른 기존 파일 2,330개·HEAD·인덱스 bytes는 동일했다. 9파일 포맷·diff 검사와 작업 트리 view 문서 6개 검증은 통과했으며 문서 오류는 0개다.

기존 Confluence 지식의 [모션 opt-in 판단](https://web-tech-service.atlassian.net/wiki/pages/19464193#모션-opt-in은-전환-속성과-시간까지-함께-확인하기)을 v8로 갱신하고 원래 본문·근거 보존, 새 개념·로컬 원본·공식 링크를 재조회했다. 상위 운영 안내의 기존 진행 댓글도 v2로 갱신했다. 첫 댓글 저장은 읽기 응답이 덧붙인 링크 class/rel 속성이 저장 형식에서 거부돼 실패했고, 기존 저장이 그대로임을 확인한 뒤 링크 목적지·본문을 보존해 정규 HTML로 다시 저장했다. 작업 기록과 별도 지식 본문을 구분한다.

### 남은 범위

로컬 적용·검증 완료이며 커밋·푸시·PR·main 병합·배포는 이번에 수행하지 않았다. 실제 Safari 앱·모바일 실기기·OS 고대비·스크린리더·LCP/INP/CLS 실측과 전체 Next 라우트 검증은 별도다. 선택 사항인 Vuln Radar outline·native 목차/overlay 교체는 적용하지 않았다. 작업 기록과 재사용 지식의 후속 갱신은 각각 별도로 확인한다.

## 관련 문서

- [이번 작업 기록](../../worklog/2026-11/2026-11-21-frontend-modernization-audit.md)
- [웹 현대화 판단 지식](https://web-tech-service.atlassian.net/wiki/pages/19464193#현대화-후보는-실제-CSS와-소비-경로로-검증하기)
- [Confluence 운영 기록](https://web-tech-service.atlassian.net/wiki/spaces/~5d12f74be69c1c0c88af2afa/pages/65817/web-tech+Jira?focusedCommentId=20250739)
- [브라우저·기기 QA](../../runbooks/docs-responsive-browser-device-checklist.md)
- [ADR-0006 공용 Base UI](../../architecture/adr-0006-shared-ui-base-ui.md)

## 사용자 요청에 따른 로컬 커밋

2026-11-21 사용자가 현재까지의 작업을 커밋하고 다음 항목으로 진행하도록 요청했다. 검증한 제품 소스 3개는 `545428a4`에 로컬 커밋했다. staged 포맷·문서·publication 검사와 실제 pre-commit/commit-msg 훅이 통과했다. 기존 다른 수정·외부 스킬·별도 JavaScript 작업·원시 자료는 포함하지 않았다.

정제 보고서·artifact·worklog와 관련 목차의 이번 항목 6개만 후속 문서 커밋으로 분리한다. 공유 목차의 다른 미커밋 항목은 인덱스에 넣지 않는다. 사용자 커밋 요청을 이번 범위의 근거로 기록하며 푸시·공개 게시·배포는 수행하지 않는다. 코드 검증 결과는 위 실행 시점의 기록이고 커밋 단계에서 브라우저 검사를 새로 실행한 결과로 보고하지 않는다.
