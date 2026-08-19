# 2026-08-10 Web App Turbo Pipeline Alignment

## What Changed

`apps/docs`와 `apps/vuln-radar`를 공통된 “웹 앱 묶음”으로 다룰 수 있도록
root Turbo 스크립트와 app-level Turbo env 선언을 정리했다.

## Why

기존 root 스크립트는:

- `turbo lint`
- `turbo typecheck`
- `turbo build`

처럼 저장소 전체 기준만 있었다.

그래서 다음 상황에서 불편함이 있었다.

- 프론트 앱 두 개만 빠르게 검증하고 싶을 때
- backend나 packages 변경과 분리해서 웹 앱 상태만 보고 싶을 때
- `docs`와 `vuln-radar`를 같은 품질 게이트로 묶어 설명하기 어려울 때

이번 작업 목적은 “웹 앱 묶음만 따로 검증하는 공통 파이프라인 이름”을 만드는 것이다.

## Implementation

### 1. Root Scripts

`package.json`

추가:

- `lint:web-apps`
- `typecheck:web-apps`
- `build:web-apps`
- `check:web-apps`

대상:

- `docs`
- `vuln-radar`

즉 frontend 성격의 두 앱만 filter로 묶어 Turbo를 실행한다.

### 2. App-Level Turbo Env Alignment

`apps/docs/turbo.json`

- `typecheck`에도 docs app env declaration 추가

`apps/vuln-radar/turbo.json`

- `lint`, `typecheck`에도 Vite / backend proxy 관련 env declaration 추가

의미:

- build/dev/start뿐 아니라 lint/typecheck에서도 같은 env contract를 Turbo cache 관점에서 해석할 수 있게 됨
- app별 task 정의 톤이 더 일관적으로 맞춰짐

### 3. Docs Build Network Independence

`apps/docs/app/layout.tsx`

- `next/font/google`의 `Inter` 의존 제거
- 기존 local font / CSS fallback 체계로 body font를 유지

의미:

- 네트워크가 제한된 환경에서도 `docs` build가 Google Fonts fetch 때문에 실패하지 않음
- `build:web-apps` 검증이 외부 폰트 요청에 덜 흔들리게 됨

### 4. UI Package Export Condition Alignment

`packages/ui/package.json`

- `./lib/*`, `./components/*` export에 `import` condition 추가

의미:

- `apps/docs`가 `moduleResolution: bundler` 기준으로 `@web-tech/ui` 서브패스를 더 안정적으로 해석할 수 있음
- workspace dist artifact는 이미 존재했지만, export condition이 덜 명시적이어서 타입체크 단계에서 불안정하게 보일 수 있던 부분을 보강함

## Result

이제 아래처럼 쓸 수 있다.

```bash
pnpm lint:web-apps
pnpm typecheck:web-apps
pnpm build:web-apps
pnpm check:web-apps
```

즉:

- 전체 monorepo 검증
- 웹 앱 묶음 검증
- 개별 앱 검증

세 레벨을 더 분명히 나눌 수 있게 됐다.

검증 메모:

- `apps/docs` 직접 `tsc --noEmit -p tsconfig.json` 기준으로 `@web-tech/ui` 서브패스 타입 해석 문제는 해소됨
- root `pnpm ...` 경로는 현재 실행 환경에서 `pnpm`이 registry metadata check를 시도해 네트워크 제한에 걸릴 수 있어, 로컬 검증 시에는 direct binary 또는 네트워크 가능한 환경 재확인이 필요함

## Follow-Up

- 필요하면 CI에도 `Web Apps` 전용 aggregation job을 별도로 둘지 검토
- 이후 `apps/web` 같은 추가 프론트 앱이 생기면 같은 스크립트 filter 범위에 포함할지 검토
