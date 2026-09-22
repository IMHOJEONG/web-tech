# 2026-08-09 Catalog Reference Validation Automation

## What Changed

`pnpm-workspace.yaml`의 `catalog` / `catalogs` 정의와
workspace 각 `package.json`의 `catalog:` 참조가 실제로 맞물리는지 검사하는 자동화 스크립트를 추가했다.

동시에 이 검사를 root script와 CI에 연결했다.

## Why

catalog를 쓰는 monorepo에서는 아래 실수가 생각보다 쉽게 생긴다.

- `catalog:web`처럼 scope는 맞지만 해당 패키지 키가 실제 catalog에 없는 경우
- root `catalog:`를 썼는데 root catalog에 패키지 엔트리가 없는 경우
- 새 dependency를 추가하면서 `package.json`만 바꾸고 `pnpm-workspace.yaml` catalog 정의를 빠뜨린 경우

이런 경우는 보통 설치 중이나 나중의 lockfile 갱신 시점에 드러난다.
이번 작업 목적은 그보다 더 빠른 정적 검증 단계에서 drift를 잡는 것이다.

## Implementation

### 1. Validation Script

새 파일:

- `scripts/validate-catalog-references.mjs`

역할:

- `pnpm-workspace.yaml`에서 `packages`, `catalog`, `catalogs` 블록을 읽음
- root package와 workspace package들의 `package.json`을 수집
- `dependencies`, `devDependencies`, `optionalDependencies`, `peerDependencies`
  안의 `catalog:` 참조를 검사
- root catalog 누락 / named catalog 누락 / catalog scope 오타를 오류로 보고
  non-zero exit로 실패

### 2. Test

새 파일:

- `scripts/validate-catalog-references.test.mjs`

검증 항목:

- workspace config parser가 필요한 블록을 읽는지
- 잘못된 root catalog / named catalog 참조를 잡는지
- 정상 참조는 통과하는지

### 3. Root Scripts

`package.json`

- `validate:catalog`
- `test:repo`

를 추가했다.

### 4. CI Wiring

`.github/workflows/ci.yml`

- `Lint` job에 `pnpm validate:catalog`
- `Test` job에 `pnpm test:repo`

를 연결했다.

## Result

이제 catalog drift는:

1. 로컬에서 `pnpm validate:catalog`
2. CI의 `Validate catalog references`
3. CI의 `Repo validation tests`

세 경로 중 하나에서 더 빠르게 드러난다.

## Follow-Up

- workspace package glob이 더 복잡해지면 현재 parser/collector를 확장할지 검토
- catalog 참조를 dependency section 밖에서 쓰는 경우까지 별도 금지할지 검토
