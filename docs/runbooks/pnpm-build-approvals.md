# pnpm Build Approvals Guide

## Purpose

이 문서는 pnpm의 dependency build script 승인 모델이 왜 도입되었는지, 버전에 따라 무엇이 달라졌는지, 그리고 이 저장소에서 어떻게 운영해야 하는지를 정리한다.

현재 이 저장소의 root `package.json`은 `pnpm@11.0.4`를 사용한다.

## Why This Exists

Node 패키지는 설치 중 `preinstall`, `install`, `postinstall` 같은 lifecycle script를 실행할 수 있다. 이 스크립트는 편의 기능을 제공하기도 하지만, 동시에 원격 코드 실행 지점이기도 하다.

pnpm은 이 지점을 공급망 보안(supply-chain security) 관점에서 더 엄격하게 다루기 시작했다.

- `pnpm approve-builds` 공식 문서는 이 명령을 "설치 중 실행되는 dependency scripts를 승인하는 절차"로 설명한다.
- pnpm 11 릴리스 노트는 보안 기본값이 강화되었고, build script 승인 정책도 더 엄격한 기본 동작으로 바뀌었다고 설명한다.

즉, 이 모델의 핵심 목적은:

- 설치 시 임의 스크립트 실행을 무심코 허용하지 않기
- 어떤 패키지의 build/install script를 신뢰하는지 저장소에 명시하기
- 팀과 CI가 같은 기준으로 설치되게 만들기

## Version Timeline

### Before `v10.1.0`

- `pnpm approve-builds` 명령은 아직 없었다.
- 현재 문서화된 승인 워크플로우는 `v10.1.0`부터 공식화되었다.

### `v10.1.x`

- `pnpm approve-builds`가 추가되었다.
- 공식 문서 기준으로, 승인된 패키지는 `onlyBuiltDependencies`에 저장되고, 승인하지 않은 패키지는 `ignoredBuiltDependencies`에 저장된다.

운영 의미:

- 이 시점부터 팀은 "어떤 dependency script를 허용할지"를 명시적으로 관리할 수 있게 되었다.

### `v10.4.x`

- `pnpm approve-builds --global` 옵션이 추가되었다.
- 전역 설치 패키지의 build script 승인도 같은 흐름으로 다룰 수 있게 되었다.

운영 의미:

- 로컬 프로젝트뿐 아니라 global package 설치 시에도 같은 보안 모델을 적용할 수 있다.

### `v11.0.0-beta.8`

- pnpm은 기존 build 관련 설정을 `allowBuilds` 하나로 통합하는 방향을 공개했다.
- 릴리스 노트는 예전의 list 기반 설정들을 object map 기반 `allowBuilds`로 바꾸는 예시를 제시한다.

운영 의미:

- `true/false`를 패키지별로 명시하는 형태가 표준이 되었다.
- `allowBuilds`는 더 읽기 쉽고, 코드리뷰 시 의도를 파악하기 쉬운 형식이다.

### `v11.0.0-rc.0` and `v11.x`

- 보안 기본값이 더 강해졌다.
- 릴리스 노트 기준으로:
  - `verifyDepsBeforeRun` 기본값이 `install`
  - `strictDepBuilds` 기본값이 `true`
  - `allowBuilds`가 기존 `onlyBuiltDependencies`, `ignoredBuiltDependencies`, `neverBuiltDependencies`, `ignoreDepScripts` 등을 대체

운영 의미:

- `pnpm format`, `pnpm test` 같은 스크립트를 실행하기 전에도 pnpm이 dependency 상태를 점검하면서 `install` 흐름을 유발할 수 있다.
- 그래서 "그냥 포맷만 돌렸는데 build approval 에러가 발생"하는 상황이 생길 수 있다.
- `allowBuilds`에 실제 boolean 값이 들어 있지 않으면, 훅이나 CI에서 예상보다 빨리 설치 오류가 드러난다.

## What `verifyDepsBeforeRun` Means

`verifyDepsBeforeRun`은 pnpm이 `pnpm run <script>`를 실행하기 전에, 현재 `node_modules`와 lockfile/dependency 상태가 유효한지 먼저 확인하는 동작이다.

pnpm 문서 기준으로 `v11` 계열에서는 이 기본값이 `install`로 강화되었다.

실무적으로는 아래처럼 보일 수 있다.

1. 사용자가 `pnpm format` 실행
2. pnpm이 바로 script를 실행하지 않음
3. 먼저 dependency 상태를 점검
4. 필요하다고 판단하면 install 흐름을 먼저 시도
5. 그 다음에 script 실행

즉, `pnpm run`은 단순히 package.json script를 문자열 그대로 실행하는 얇은 래퍼가 아니라, "현재 dependency 상태가 안전하고 일관적인가"까지 확인하는 진입점이 되었다.

### Why It Feels Surprising

이 설정 때문에 다음 같은 경험이 생길 수 있다.

- `pnpm format`을 실행했는데 갑자기 install 로그가 보임
- `pnpm run rm:node_modules`처럼 삭제용 script를 실행했는데, 삭제 전에 install이 걸림
- git hook의 `pnpm format`이 build approval 에러로 실패함

이건 script 내용 자체의 문제라기보다, script 실행 전에 pnpm이 dependency 상태를 확인하려고 개입하기 때문이다.

### Why pnpm Added This

목적은 대체로 세 가지다.

- lockfile과 실제 설치 상태가 어긋난 상태에서 script가 도는 것을 줄이기
- 팀원/CI/로컬이 더 같은 dependency 상태에서 실행되게 하기
- 보안 설정과 build approval 정책을 script 실행 시점에도 일관되게 적용하기

### What It Means For This Repository

현재 이 저장소처럼:

- `pnpm@11.0.4`를 사용하고
- build approvals를 엄격하게 관리하고
- git hook에서 `pnpm format`을 실행하면

script 실행 전 dependency 상태 확인이 곧 install/build approval/store write와 연결될 수 있다.

그래서 삭제 전용 명령이나 순수 shell 명령은 `pnpm run`에 넣기보다, 필요할 때 직접 shell에서 실행하는 편이 오히려 덜 헷갈릴 수 있다.

예시:

```bash
find . -name node_modules -type d -prune -exec rm -rf '{}' +
```

### When To Consider Changing It

다음 조건이 모두 있으면 설정 변경을 검토할 수 있다.

- script 실행 시 자동 install 개입이 팀 DX를 과하게 해친다
- install 일관성보다 script 반응성을 더 우선한다
- 로컬과 CI에서 dependency 상태 관리 절차가 이미 충분히 엄격하다

다만 이 설정은 dependency 일관성과 보안 체크 경험에 직접 영향을 주므로, 바꾸기 전에 팀 기준을 먼저 정하는 편이 좋다.

## Old Config vs New Config

### `v10` style

```yaml
onlyBuiltDependencies:
  - esbuild
  - sharp

ignoredBuiltDependencies:
  - some-untrusted-package
```

### `v11` style

```yaml
allowBuilds:
  esbuild: true
  sharp: true
  some-untrusted-package: false
```

핵심 차이:

- `v10`은 허용 목록과 거부 목록이 분리된 list 중심 구조다.
- `v11`은 패키지별 허용 여부를 한곳에서 보는 map 구조다.

## What This Means For This Repository

이 저장소는 현재 `pnpm@11.0.4`를 사용하므로, 실무적으로는 `allowBuilds` 기준으로 관리해야 한다.

특히 아래 상황에 영향이 크다.

- git hook에서 `pnpm format` 같은 스크립트를 실행할 때
- CI에서 `pnpm install`, `pnpm test`, `pnpm build`를 실행할 때
- `node_modules`를 지운 뒤 새로 설치할 때
- pnpm 버전을 올린 직후 첫 install/run을 할 때

현재 주의할 점:

- `allowBuilds` 값은 `true` 또는 `false`여야 한다.
- `set this to true or false` 같은 placeholder 문자열은 실제 승인 상태가 아니다.
- placeholder가 남아 있으면 pnpm 11 환경에서 install 또는 script run 도중 오류가 날 수 있다.

## Team Policy Recommendation

### Use `true` when

- 해당 패키지가 빌드 도구 체인에 필수다
- install/postinstall/build script가 없으면 프로젝트가 정상 동작하지 않는다
- 팀이 그 패키지를 의도적으로 사용 중이고, 실행을 신뢰한다

대표 예시:

- `esbuild`
- `@swc/core`
- `sharp`
- `prisma`
- `@prisma/engines`
- `@parcel/watcher`
- `simple-git-hooks`
- `unrs-resolver`

### Use `false` when

- 그 패키지의 스크립트를 일부러 차단하고 싶다
- 실제로 프로젝트에서 필요하지 않다
- 설치는 되더라도 해당 부가 스크립트 실행은 원치 않는다

주의:

- `false`는 "경고 숨기기" 용도가 아니라 "실행 금지" 선언이다.
- 필요한 패키지에 `false`를 넣으면 설치, 빌드, 런타임 기능이 깨질 수 있다.

## Recommended Workflow

1. pnpm 버전을 올렸다면 먼저 현재 저장소가 어떤 config shape를 요구하는지 확인한다.
2. `pnpm approve-builds`를 실행해 실제 필요한 패키지를 식별한다.
3. `pnpm-workspace.yaml`에 `allowBuilds`를 boolean 값으로 확정한다.
4. clean install과 주요 script를 다시 실행한다.
5. 결과를 lockfile과 함께 커밋해 팀과 CI가 같은 상태를 사용하게 한다.

## Suggested Local Checklist

- `package.json`의 `packageManager` 버전 확인
- `pnpm-workspace.yaml`의 build approval 설정 형식 확인
- `node_modules` 삭제 후 `pnpm install` 재검증
- `pnpm format`
- `pnpm test`
- 주요 앱 build

## Source Links

- pnpm `approve-builds` docs
  - https://pnpm.nodejs.cn/cli/approve-builds/
- pnpm `approve-builds` docs (alternate mirror)
  - https://www.pnpm.cn/en/cli/approve-builds
- pnpm `v11.0.0-beta.8` release notes
  - https://github.com/pnpm/pnpm/releases/tag/v11.0.0-beta.8
- pnpm `v11.0.0-rc.0` release notes
  - https://github.com/pnpm/pnpm/releases/tag/v11.0.0-rc.0
- pnpm homepage
  - https://pnpm.io/
