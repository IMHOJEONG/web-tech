# UI Build Export Retrospective

## Why This Document Exists

`packages/ui`를 source export에서 build export로 전환하면서, 단순 설정 변경 이상으로 여러 종류의 문제가 함께 드러났다.

이 문서는 아래를 한 번에 정리하기 위한 용도다.

- 실제로 어떤 이슈가 있었는지
- 각각을 어떻게 해결했는지
- 아직 남아 있는 고민점이 무엇인지
- 앞으로 이 구조를 이해하려면 어떤 코드를 읽어야 하는지
- 어떤 개념을 배우면 좋은지

## Short Summary

이번 전환의 핵심 흐름은 이랬다.

1. `apps/docs`가 `packages/ui` 내부 alias를 직접 해석하고 있었다.
2. 이를 줄이기 위해 `packages/ui` 내부 source import를 정리했다.
3. 이후 `packages/ui`를 `dist` 산출물 기반 export로 전환했다.
4. 그 과정에서 `Next build`, `transpilePackages`, `client boundary`, `jsx runtime` 문제가 드러났다.
5. 현재는 `ui build -> docs consume` 흐름이 타입 레벨에서는 정리됐고, build 단계 이슈도 상당 부분 좁혀진 상태다.

## Issue Timeline

### 1. `apps/docs`가 `packages/ui` 내부 alias를 알아야 했음

증상:

- `apps/docs/tsconfig.json`에 `@/* -> ../../packages/ui/*` 매핑이 필요했다.
- `@web-tech/ui`를 쓰는 소비 앱이 패키지 내부 구조를 같이 알아야 했다.

원인:

- `packages/ui`가 source export를 하고 있었고
- 내부 source가 `@/components`, `@/lib`, `@/hooks` alias를 직접 사용하고 있었다.

해결:

- `packages/ui/components/ui/*`
- `packages/ui/components/ui/sidebar.tsx`

안의 `@/...` import를 상대경로로 변경했다.

영향:

- `apps/docs`는 더 이상 `packages/ui` 내부 alias를 해석할 필요가 없어졌다.

### 2. `packages/ui`는 패키지인데, 실제로는 “공유 폴더”처럼 동작했음

증상:

- source export 구조에서는 소비 앱이 패키지 내부 TypeScript/JSX 설정에 영향을 받았다.
- 패키지 경계가 약했다.

고민:

- source export를 유지할지
- build export로 전환할지

결정:

- 장기적으로는 build export가 더 실무적인 구조라고 판단했다.

관련 문서:

- [ui-package-build-export.md](/Users/coder/Desktop/project/web-tech/docs/architecture/ui-package-build-export.md)

### 3. build export 전환 후 `docs` 단독 빌드에서 `ui/dist`가 필요해짐

증상:

- `pnpm --filter docs build` 시 `@web-tech/ui` 산출물이 먼저 필요했다.

해결:

- [packages/ui/package.json](/Users/coder/Desktop/project/web-tech/packages/ui/package.json)
  - `build`, `dev` 스크립트 추가
- [packages/ui/tsconfig.build.json](/Users/coder/Desktop/project/web-tech/packages/ui/tsconfig.build.json)
  - `dist` 전용 build 설정 추가
- [apps/docs/package.json](/Users/coder/Desktop/project/web-tech/apps/docs/package.json)
  - `prebuild`, `predev` 추가
- [apps/web/package.json](/Users/coder/Desktop/project/web-tech/apps/web/package.json)
  - 동일하게 `prebuild`, `predev` 추가

의미:

- 앱 단독 빌드 시에도 `ui` 산출물이 선행되도록 맞췄다.

### 4. `next build` lock 문제

증상:

- `Another next build process is already running`

원인:

- 이전 `next build` 프로세스가 비정상 종료 없이 남아 있거나
- `.next/lock`을 실제 node 프로세스가 점유하고 있었다.

판단:

- 이건 구조 문제라기보다 build 실행 상태 문제다.
- `.next`를 매번 지우는 걸 기본 전략으로 삼는 건 권장하지 않는다.

운영 원칙:

- 평소엔 그냥 `next build`
- lock이나 꼬인 캐시가 의심될 때만 `.next` 정리

### 5. `/category`에서 `f.createContext is not a function`

증상:

- `pnpm --filter docs build`
- page data 수집 단계
- `/category` 경로에서 실패

오류:

- `Failed to collect configuration for /category`
- `TypeError: f.createContext is not a function`

1차 원인 판단:

- build export로 바뀐 `@web-tech/ui`를 `apps/docs`가 Next 패키지 transpile 대상으로 처리하지 않았다.

해결:

- [apps/docs/next.config.mjs](/Users/coder/Desktop/project/web-tech/apps/docs/next.config.mjs)
  - `transpilePackages: ['@web-tech/ui']` 추가

효과:

- `apps/web`와 동일한 기준으로 맞춰졌고
- 적어도 같은 즉시 실패 지점은 재현되지 않기 시작했다.

### 6. `@emotion/react/jsx-runtime`가 build 산출물에 깊게 들어감

증상:

- `packages/ui/dist/components/ui/badge.js` 같은 일반 shadcn/ui 산출물도
  `@emotion/react/jsx-runtime`를 import하고 있었다.

고민:

- `packages/ui` 안에는 Emotion `styled`를 쓰는 레이아웃 컴포넌트가 일부 있다.
- 하지만 shadcn/ui 계열 일반 컴포넌트까지 전부 Emotion JSX runtime을 탈 필요는 없다.

해결:

- [packages/ui/tsconfig.build.json](/Users/coder/Desktop/project/web-tech/packages/ui/tsconfig.build.json)
  - `jsxImportSource: "react"` override

효과:

- build 산출물의 일반 JSX 컴포넌트는 `react/jsx-runtime`를 사용하게 됐다.
- `/category` build 수집 구간의 runtime 혼선을 줄일 가능성이 커졌다.

## What Was Actually Solved

현재 기준으로 해결된 것:

- `apps/docs`가 `packages/ui` 내부 alias를 직접 해석하지 않아도 됨
- `packages/ui`는 `dist` build 산출물을 생성함
- `apps/docs`, `apps/web`는 앱 단독 실행 시 `ui build`를 먼저 수행함
- `docs`는 `@web-tech/ui`를 `transpilePackages`로 처리함
- 일반 shadcn/ui 산출물은 `react/jsx-runtime` 기준으로 배출됨

## Remaining Concerns

### 1. `docs build` 최종 완료 로그를 항상 확보한 것은 아님

이유:

- 중간에 남아 있던 `next build` lock과 충돌한 세션이 있었다.

의미:

- 구조적 회귀는 많이 줄었지만, “완전 종료 로그까지 항상 확인된 상태”라고 말하려면 한 번 더 깨끗한 환경에서 확인이 필요하다.

### 2. `packages/ui` 안에는 여전히 Emotion 레이아웃 컴포넌트가 있음

예:

- [packages/ui/layout/Column.tsx](/Users/coder/Desktop/project/web-tech/packages/ui/layout/Column.tsx)
- [packages/ui/layout/Pane/Pane.tsx](/Users/coder/Desktop/project/web-tech/packages/ui/layout/Pane/Pane.tsx)
- [packages/ui/layout/Navigation/nav-bar.tsx](/Users/coder/Desktop/project/web-tech/packages/ui/layout/Navigation/nav-bar.tsx)

의미:

- 패키지 전체에서 Emotion을 완전히 제거한 건 아니다.
- 지금은 “build 산출물의 일반 JSX 컴포넌트가 React runtime을 쓰게 만든 것”에 가깝다.

### 3. `predev`는 한 번 build만 해줌

즉:

- `apps/docs` 디렉터리 안에서 직접 `pnpm dev`를 하면
- 시작 전에 `ui build`는 되지만
- 이후 `packages/ui` 수정분이 자동 watch되지는 않는다.

그래서 권장 흐름은:

- root에서 `pnpm dev:docs`
- 또는 `turbo dev --filter=docs`

이다.

## What To Read In Code

아래 파일들을 순서대로 보면 이번 이슈를 가장 잘 이해할 수 있다.

### 1. build/export 경계

- [packages/ui/package.json](/Users/coder/Desktop/project/web-tech/packages/ui/package.json)
- [packages/ui/tsconfig.json](/Users/coder/Desktop/project/web-tech/packages/ui/tsconfig.json)
- [packages/ui/tsconfig.build.json](/Users/coder/Desktop/project/web-tech/packages/ui/tsconfig.build.json)

보면 좋은 포인트:

- source export와 build export 차이
- `exports` map이 소비 앱 해석 방식에 어떻게 영향을 주는지
- build 전용 tsconfig를 왜 분리했는지

### 2. 소비 앱 연결 지점

- [apps/docs/package.json](/Users/coder/Desktop/project/web-tech/apps/docs/package.json)
- [apps/docs/next.config.mjs](/Users/coder/Desktop/project/web-tech/apps/docs/next.config.mjs)
- [apps/web/package.json](/Users/coder/Desktop/project/web-tech/apps/web/package.json)

보면 좋은 포인트:

- `prebuild`, `predev`
- `transpilePackages`
- 앱 단독 실행과 root turbo 실행의 차이

### 3. 실제 회귀가 난 컴포넌트

- [apps/docs/app/category/layout.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/app/category/layout.tsx)
- [apps/docs/app/category/page.tsx](/Users/coder/Desktop/project/web-tech/apps/docs/app/category/page.tsx)
- [packages/ui/components/ui/sidebar.tsx](/Users/coder/Desktop/project/web-tech/packages/ui/components/ui/sidebar.tsx)
- [packages/ui/components/ui/badge.tsx](/Users/coder/Desktop/project/web-tech/packages/ui/components/ui/badge.tsx)

보면 좋은 포인트:

- server/client 경계
- `use client`가 패키지 바깥으로 나갔을 때 왜 민감해지는지
- category route가 왜 먼저 깨졌는지

### 4. 실제 산출물

- [packages/ui/dist/components/ui/sidebar.js](/Users/coder/Desktop/project/web-tech/packages/ui/dist/components/ui/sidebar.js)
- [packages/ui/dist/components/ui/badge.js](/Users/coder/Desktop/project/web-tech/packages/ui/dist/components/ui/badge.js)

보면 좋은 포인트:

- source와 build 결과가 실제로 어떻게 달라지는지
- `react/jsx-runtime` vs `@emotion/react/jsx-runtime`
- Next build가 “원본 소스”보다 “산출물 형태”의 영향을 받는 순간

## What To Learn Next

### 1. Next.js `transpilePackages`

배우면 좋은 이유:

- workspace 패키지를 앱이 어떻게 번들링하는지 이해할 수 있다.
- build export와 source export를 섞을 때 어디서 깨지는지 감이 생긴다.

### 2. React Server / Client Boundary

특히:

- `use client`
- server component가 client component를 import할 때의 규칙
- package 바깥으로 빠진 client module이 어떻게 해석되는지

이걸 이해하면 `/category`에서 왜 `SidebarProvider`가 민감했는지 보인다.

### 3. TypeScript build config 분리

특히:

- `tsconfig.json`
- `tsconfig.build.json`
- `outDir`, `rootDir`, `jsxImportSource`

이런 설정을 언제 분리해야 하는지 익히면 공용 패키지 운영이 쉬워진다.

### 4. Library Packaging Basics

특히:

- `package.json` `exports`
- 타입 선언 배출
- CJS/ESM 차이
- source export vs dist export

이건 모노레포 공용 패키지를 운영할 때 거의 기본기다.

### 5. Debugging Built Output

이번처럼:

- `dist/*.js`
- `.next/server/chunks/ssr/*`

를 직접 보는 습관이 중요하다.

소스만 보고 있으면 “왜 runtime에서 저렇게 번들됐지?”를 놓치기 쉽다.

## Recommended Practical Rule

당분간은 아래 기준으로 운영하는 게 가장 안전하다.

1. 공용 UI 수정이 포함되면 root에서 `pnpm dev:docs` 또는 turbo 기준으로 실행
2. 앱 단독 build가 필요하면 `pnpm --filter docs build`
3. lock 꼬임일 때만 `.next` 정리
4. build 에러가 모호하면
   - `packages/ui/dist/*`
   - `apps/docs/.next/server/chunks/ssr/*`
     를 같이 본다

## Related Docs

- [ui-package-build-export.md](/Users/coder/Desktop/project/web-tech/docs/architecture/ui-package-build-export.md)
- [docs-content-rendering-strategy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-rendering-strategy.md)
- [docs-env-checklist.md](/Users/coder/Desktop/project/web-tech/docs/runbooks/docs-env-checklist.md)
