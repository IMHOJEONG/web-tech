# 2026-05-26 PR 템플릿과 CI 품질 게이트 추가

## 요약

- 이 저장소에서 GitHub PR 기반 코드 리뷰를 실제로 운영할 수 있도록 PR 템플릿을 추가했다.
- 루트와 주요 앱/패키지에 `lint`, `typecheck` 스크립트를 보강했다.
- CI를 `Lint`, `Typecheck`, `Build`, `Test` 네 개의 개별 체크로 분리했다.

## 변경 파일

- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`
- `package.json`
- `turbo.json`
- `apps/docs/package.json`
- `apps/vuln-radar/package.json`
- `apps/vuln-radar-backend/package.json`
- `apps/fe-box/package.json`
- `packages/ui/package.json`
- `packages/api/package.json`

## 메모

- PR 템플릿에는 이 저장소 운영 방식에 맞춰 `문서 업데이트`, `knowledge 반영`, `AI 리뷰 기록` 항목을 넣었다.
- backend의 기존 `lint`는 `--fix`를 쓰고 있었는데, CI/status check 용도로는 자동 수정 없는 검증형 스크립트가 더 적합해서 `lint`와 `lint:fix`로 분리했다.
- CI를 개별 job으로 분리했기 때문에 이후 GitHub ruleset에서 `Lint`, `Typecheck`, `Build`, `Test`를 각각 required status check로 걸기 쉬워졌다.

## 다음

- 실제 CI에서 각 워크스페이스의 `lint`/`typecheck`가 모두 통과하는지 확인한다.
- 필요하면 `apps/docs`와 `apps/vuln-radar`의 lint 범위를 더 정교하게 다듬는다.

## 검증 결과

- `env CI=true pnpm lint`
  - 실패
  - 공통 ESLint 실행 단계에서 `@eslint/eslintrc` / `ajv` 계열 오류 발생
  - 증상:
    - `NOT SUPPORTED: option missingRefs`
    - `TypeError: Cannot set properties of undefined (setting 'defaultMeta')`
  - 영향 범위:
    - `docs`
    - `vuln-radar`
    - `vuln-radar-backend`
    - `@web-tech/ui`
    - `@web-tech/api`
- `env CI=true pnpm typecheck`
  - 부분 성공 후 `fe-box`에서 실패
  - 확인된 원인:
    - Prisma generated client 누락
    - `@tanstack/query-core` 버전 불일치로 인한 `QueryClient` 타입 충돌
    - 일부 demo route의 명시적 타입 누락 및 CSS prop 타입 오류

즉 이번 작업으로 `lint/typecheck` 게이트 구조는 붙였지만, required status check로 강제하기 전에 기존 워크스페이스 오류를 먼저 정리해야 한다.
