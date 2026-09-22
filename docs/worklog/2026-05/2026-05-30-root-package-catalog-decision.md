# 2026-05-30 root package catalog 확장 결정

## 작업 내용

- root `package.json`까지 catalog/버전 관리 전략을 확장할지 검토했다.
- 결론은 “확장한다”로 정리했고, root toolchain 의존성을 `catalog:` 참조로 전환했다.
- `pnpm-workspace.yaml`의 기본 catalog에 root에서 쓰는 도구 버전을 추가했다.

## 이번에 catalog로 올린 항목

- `@eslint/compat`
- `eslint`
- `prettier`
- `simple-git-hooks`
- `turbo`
- `typescript`

## 결정 이유

- 이 의존성들은 특정 앱 전용이라기보다 workspace 전체 개발 흐름의 기준점으로 작동한다.
- root에 직접 semver를 남겨두면 workspace package와 기준점이 분리되어 drift가 생기기 쉽다.
- root-only 도구라도 repo 전체 lint, format, build, hook, task orchestration에 영향을 주면 catalog 중앙 관리 이점이 있다.

## 판단 기준

- catalog로 올린다
  - repo 전체 개발 흐름에 영향을 주는 도구
  - 버전 기준점을 한 군데로 모으는 편이 이득인 도구
- root에만 남긴다
  - 스크립트 문자열
  - hook 설정 값
  - `engines`, `packageManager`처럼 catalog 대상이 아닌 메타 정보

## 후속 메모

- 다음 단계는 `catalog reference` 정합성 검사를 스크립트나 CI에서 자동화하는 일이다.
- root만 catalog로 바꾸고 검증이 없으면 다시 direct semver가 섞일 수 있다.
- `pnpm install --lockfile-only`도 외부 네트워크 환경에서 다시 실행해 현재 설정이 lockfile 경로에서도 문제 없음을 확인했다.
