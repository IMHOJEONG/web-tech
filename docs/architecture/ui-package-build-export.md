# UI Package Build Export Strategy

## Context

`packages/ui`는 원래 `.ts` / `.tsx` 소스를 그대로 export하고, 소비 앱이 직접 이를 해석하는 방식이었다.

이 방식은 초기 개발 속도에는 유리했지만 아래 문제가 실제로 발생했다.

- 소비 앱(`apps/docs`)이 `packages/ui` 내부 alias 구조까지 알아야 했다.
- `packages/ui` 내부 구현 변경이 소비 앱의 `tsconfig`와 번들 설정에 직접 영향을 줬다.
- shadcn/ui 컴포넌트를 공용 패키지처럼 두고도, 실제로는 “패키지”보다 “공유 폴더”에 가까운 구조였다.

이번 정리는 `packages/ui`를 실제 라이브러리처럼 다루기 위해, build export 기반으로 전환하는 결정이다.

## Options

### 1. Source Export 유지

의미:

- `packages/ui`의 소스를 앱이 직접 읽는다.

장점:

- 설정이 단순하다.
- 초기 개발 속도가 빠르다.
- 패키지 수정이 앱에 즉시 반영되어 로컬 DX가 좋다.
- 별도 build step이 없다.

단점:

- 소비 앱이 패키지 내부 TypeScript/alias/JSX 설정에 영향을 받는다.
- 패키지 경계가 약하다.
- 앱이 늘수록 재사용 구조보다 결합 구조에 가까워진다.
- 외부 배포, 독립 테스트, 도구 간 호환성이 떨어진다.

### 2. Build Export 전환

의미:

- `packages/ui`를 `dist`로 빌드한 뒤, 소비 앱은 산출물만 읽는다.

장점:

- 패키지 경계가 명확해진다.
- 소비 앱이 내부 alias나 TS 설정을 몰라도 된다.
- 여러 앱이 함께 사용할 때 안정적이다.
- 빌드/배포 관점에서 실무적인 라이브러리 구조에 가깝다.

단점:

- build/watch 단계가 추가된다.
- 앱 단독 실행 시에도 `ui` 산출물이 먼저 준비되어야 한다.
- dev workflow를 같이 설계하지 않으면 “dist가 오래된 상태”가 생길 수 있다.

## Decision

`packages/ui`는 build export 기반으로 전환한다.

이번 전환에서 적용한 기준:

- `packages/ui`는 `tsc`로 `dist` 산출물을 만든다.
- package `exports`는 source가 아니라 `dist`를 가리킨다.
- 소비 앱은 `@web-tech/ui/...`만 사용하고, `packages/ui` 내부 alias를 해석하지 않는다.
- Turbo `build`는 `dist/**`를 산출물로 취급한다.
- Turbo `dev`는 의존 패키지의 `dev`를 먼저 실행한다.
- `apps/docs`, `apps/vuln-radar`는 단독 `build/dev` 시에도 `prebuild` / `predev`로 `@web-tech/ui build`를 먼저 수행한다.

## Why This Fits This Repo

현재 repo는 이미 `packages/ui`를 공용 패키지로 두고 있고, `apps/docs`와 `apps/vuln-radar`가 이를 소비하는 구조다.

즉 지금 단계에서는:

- 빠른 초기 실험만 중요한 시점은 지났고
- 공용 UI의 경계와 안정성이 더 중요해졌다.

실제로 이번에도 `apps/docs`에서 `@/* -> ../../packages/ui/*` 같은 우회 alias를 제거하려면, `packages/ui` 내부 구현이 소비 앱으로 새지 않도록 먼저 정리해야 했다.

이 문제는 source export보다 build export가 더 자연스럽게 해결한다.

## Operational Notes

권장 실행 방식:

- 로컬 개발: root에서 `pnpm dev:docs`, `pnpm dev:vuln-radar`
- 패키지 단독 검증: `pnpm --filter @web-tech/ui build`

주의:

- `apps/docs`를 앱 디렉터리에서 직접 `pnpm dev`로 띄우면 `predev`로 한 번 빌드는 되지만, 이후 `packages/ui` 수정 사항은 자동 watch되지 않는다.
- 공용 UI를 함께 수정하는 개발 플로우에서는 root turbo dev를 사용하는 편이 더 안전하다.

## Validation

확인된 내용:

- `packages/ui`는 `dist` 산출물을 정상 생성한다.
- `apps/docs`는 `packages/ui` 내부 alias 매핑 없이 `pnpm --filter docs exec tsc --noEmit`를 통과한다.

추가 확인 포인트:

- `next build`는 이 세션에서 별도 `next build` lock이 남아 최종 완료 로그를 다시 확보하지 못했다.
- 다만 `prebuild -> @web-tech/ui build -> next build` 흐름 자체는 정상 진입하는 것까지 확인했다.
