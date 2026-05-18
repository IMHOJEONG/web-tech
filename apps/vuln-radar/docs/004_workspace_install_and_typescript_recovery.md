## workspace 설치/타입 해석 장애 복구

이 문서는 `apps/vuln-radar`에서 아래와 같은 문제가 한꺼번에 보일 때
무엇을 먼저 의심하고, 어떤 순서로 복구할지 정리한 런북이다.

## 대상 증상

대표 증상:

- `@web-tech/ui prebuild` 실패
- `@web-tech/typescript-config/react-library`를 찾지 못함
- `react`, `vite`, `zod`, `@tanstack/*`를 찾지 못함
- `--jsx is not set`
- `Cannot use JSX unless the '--jsx' flag is provided`
- `Cannot find type definition file for 'vite/client'`

겉으로는 `tsconfig` 문제처럼 보이지만,
실제 원인은 `workspace node_modules 링크 상태가 깨진 경우`가 많다.

## 이번에 실제로 확인한 원인

문제 당시 상태:

- `pnpm-lock.yaml`에는 `vuln-radar`, `@web-tech/ui`, `@web-tech/typescript-config` 의존성이 이미 기록되어 있었다.
- 그런데 실제 [apps/vuln-radar](/Users/coder/Desktop/project/web-tech/apps/vuln-radar)와 [packages/ui](/Users/coder/Desktop/project/web-tech/packages/ui)의 `node_modules`는 거의 비어 있었다.
- 그래서 TypeScript는 `extends: "@web-tech/typescript-config/react-library"`도 해석하지 못했고,
  연쇄적으로 React/Vite/JSX 타입까지 모두 깨진 것처럼 보였다.

즉 핵심 원인은:

`설정 파일 내용 자체`보다 `pnpm workspace 링크가 정상적으로 재구성되지 않은 상태`였다.

## 빠른 진단 순서

### 1. lockfile에 의존성이 있는지 확인

루트에서:

```bash
rg -n "apps/vuln-radar:|packages/ui:|packages/typescript-config:" pnpm-lock.yaml
```

이 결과가 잡히면 lockfile 해상도는 이미 존재한다는 뜻이다.

### 2. 앱/패키지 node_modules 링크 상태 확인

```bash
ls -la apps/vuln-radar/node_modules
ls -la packages/ui/node_modules
```

정상이라면 `react`, `vite`, `@tanstack`, `@web-tech` 같은 링크가 보여야 한다.

비정상이면:

- 디렉터리가 거의 비어 있음
- `.vite` 정도만 있고 실제 dependency 링크가 없음

이 경우는 코드 수정 전에 `pnpm install` 복구를 먼저 해야 한다.

### 3. tsconfig export 자체가 맞는지 확인

[packages/typescript-config/package.json](/Users/coder/Desktop/project/web-tech/packages/typescript-config/package.json:1)
기준으로 아래 export가 있어야 한다.

- `./base`
- `./react-library`
- `./nextjs`

현재 repo는 이 export가 이미 정상이다.
따라서 `react-library`를 못 찾는다면 설정 파일보다 설치/링크 쪽을 먼저 의심한다.

## 복구 방법

### 기본 복구 명령

루트에서:

```bash
CI=true pnpm install --config.confirmModulesPurge=false
```

이 명령의 목적:

- 깨진 workspace 링크 재구성
- 각 패키지별 `node_modules` 심링크 복원
- `@web-tech/typescript-config`, `@web-tech/ui`, React/Vite 관련 의존성 재연결

### 왜 `CI=true`와 `confirmModulesPurge=false`를 같이 쓰는가

이 repo에서는 `pnpm install --offline` 또는 일반 `pnpm install`이
TTY가 없는 환경에서 아래 메시지로 멈출 수 있다.

```text
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
```

그래서:

- `CI=true`
- `--config.confirmModulesPurge=false`

를 주어 `node_modules` 재구성을 확인 프롬프트 없이 진행한다.

### 오프라인 설치가 실패하는 경우

만약 아래 에러가 나오면:

```text
ERR_PNPM_NO_OFFLINE_TARBALL
```

의미는:

- lockfile은 맞지만
- 로컬 pnpm store에 필요한 tarball이 없어
- 온라인 설치가 한 번 필요하다는 뜻이다.

이 경우에는 오프라인이 아니라 일반 `pnpm install`로 복구한다.

## 복구 후 검증 순서

루트에서 순서대로:

```bash
pnpm --filter @web-tech/ui build
pnpm --filter vuln-radar exec tsc -p tsconfig.json --noEmit
pnpm --filter vuln-radar build
```

이 세 단계가 통과하면:

- `@web-tech/ui prebuild`
- `@web-tech/typescript-config/react-library` 해석
- React/Vite/JSX 타입 해석
- `vuln-radar` production build

까지 모두 정상으로 본다.

## 헷갈리기 쉬운 포인트

### `--jsx is not set`가 진짜 JSX 설정 문제는 아닐 수 있다

이 증상은 실제로는:

- `extends` 대상 tsconfig를 못 읽었고
- 그래서 `jsx` 옵션이 상속되지 않았기 때문에
  나타나는 2차 증상일 수 있다.

즉 `tsconfig.json`만 바로 고치기 전에
`@web-tech/typescript-config/react-library`를 실제로 읽고 있는지 먼저 확인해야 한다.

### `react`, `vite`, `zod`를 동시에 못 찾으면 코드보다 설치를 먼저 본다

하나의 라이브러리만 못 찾는 게 아니라
기초 의존성을 여러 개 동시에 못 찾는다면
대부분은 파일 수정 문제가 아니라 workspace 링크 문제다.

## 재발 시 권장 체크리스트

1. `pnpm-lock.yaml`에 대상 워크스페이스가 기록돼 있는지 본다.
2. 앱과 패키지 `node_modules` 링크가 실제로 채워져 있는지 본다.
3. `packages/typescript-config/package.json`의 `exports`가 맞는지 본다.
4. 코드 수정 전에 루트에서 `CI=true pnpm install --config.confirmModulesPurge=false`를 실행한다.
5. `@web-tech/ui build -> vuln-radar tsc -> vuln-radar build` 순서로 검증한다.

## 현재 결론

이번 장애는 `TypeScript 설정 정의 오류`가 아니라
`pnpm workspace 설치/링크 상태 붕괴`에 가까웠다.

따라서 재발 시 첫 대응은:

`tsconfig를 뜯어고치기 전에 workspace install 상태를 먼저 복구한다`

로 가져가는 편이 가장 빠르다.
