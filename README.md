# web-tech

`web-tech`는 여러 프론트엔드 앱, 백엔드 서비스, 공용 UI 패키지, 그리고 운영 문서를 함께 관리하는 모노레포입니다.

현재 저장소는 크게 두 제품 축을 중심으로 움직입니다.

- `apps/docs`
  - 기술 아카이브와 블로그 성격의 Next.js 앱
- `apps/vuln-radar` + `apps/vuln-radar-backend`
  - 취약점 탐색 대시보드와 수집/정규화 API

## Workspace Overview

```text
web-tech/
├─ apps/
│  ├─ docs/
│  ├─ vuln-radar/
│  └─ vuln-radar-backend/
├─ packages/
│  ├─ api/
│  ├─ eslint-config/
│  ├─ tailwind-config/
│  ├─ typescript-config/
│  └─ ui/
├─ docs/
├─ scripts/
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Apps

### `apps/docs`

Next.js 기반의 기술 문서 앱입니다.

- long-form article, channel hub, search 경험을 다룸
- MDX / remote content / editorial metadata 흐름을 함께 관리
- 관련 문서:
  - [apps/docs/README.md](./apps/docs/README.md)
  - [docs/architecture/docs-blog-improvement-roadmap.md](./docs/architecture/docs-blog-improvement-roadmap.md)

### `apps/vuln-radar`

Vite + React 기반의 취약점 탐색 프론트엔드입니다.

- 관심 기술 기준으로 빠르게 위험 신호를 확인하는 대시보드
- overview, feed, watchlist, alert 중심 UX
- 관련 문서:
  - [apps/vuln-radar/README.md](./apps/vuln-radar/README.md)

### `apps/vuln-radar-backend`

NestJS 기반의 취약점 수집/정규화 백엔드입니다.

- 외부 vulnerability feed 수집
- risk score 계산
- frontend용 API와 운영 흐름 제공
- 관련 문서:
  - [apps/vuln-radar-backend/README.md](./apps/vuln-radar-backend/README.md)

## Shared Packages

### `packages/ui`

공용 React UI 컴포넌트와 layout primitive를 담습니다.

### `packages/tailwind-config`

공용 Tailwind 설정과 shared style layer를 담습니다.

### `packages/typescript-config`

앱/패키지별로 재사용하는 TypeScript base config를 담습니다.

### `packages/eslint-config`

저장소 공통 ESLint 설정을 담습니다.

### `packages/api`

공용 API 타입 또는 helper 확장을 위한 패키지입니다.

## Tooling Stack

- `pnpm workspace`
- `Turborepo`
- `TypeScript`
- `Prettier`
- `ESLint`

패키지 버전 관리는 `pnpm-workspace.yaml`의 catalog를 기준으로 맞춥니다.

## Getting Started

### 1. Install

```bash
pnpm install
```

### 2. Run

루트에서 자주 쓰는 개발 명령은 아래와 같습니다.

```bash
pnpm dev
pnpm dev:docs
pnpm dev:vuln-radar
pnpm dev:vuln-radar-backend
pnpm dev:vuln-radar:full
```

## Common Commands

### 전체 워크스페이스

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
```

### docs 앱

```bash
pnpm dev:docs
pnpm start:docs
pnpm vercel:deploy:docs
```

### vuln-radar 앱

```bash
pnpm dev:vuln-radar
pnpm dev:vuln-radar-backend
pnpm dev:vuln-radar:full
pnpm start:vuln-radar
pnpm start:vuln-radar:full
pnpm vercel:deploy:vuln-radar
```

## Monorepo Conventions

### Branching

- trunk-based 흐름을 기본으로 사용
- 작은 단위 브랜치에서 작업 후 빠르게 병합하는 방식을 권장
- 관련 문서:
  - [docs/process/branch-policy.md](./docs/process/branch-policy.md)

### Commit Messages

- `Conventional Commits`
- 권장 형식:
  - `type(scope): summary`
- 관련 문서:
  - [docs/process/commit-message-convention.md](./docs/process/commit-message-convention.md)

### Documentation Flow

- 구조적 결정은 `docs/architecture/`
- 운영 절차는 `docs/runbooks/`
- 작업 기록은 `docs/worklog/`
- 지속 백로그는 `docs/todo/`

## Recommended Reading

- [docs/README.md](./docs/README.md)
- [docs/knowledge/README.md](./docs/knowledge/README.md)
- [docs/process/code-review-process.md](./docs/process/code-review-process.md)
- [docs/architecture/ui-package-build-export.md](./docs/architecture/ui-package-build-export.md)

## Notes

- 앱별 환경 변수와 운영 메모는 각 앱의 README 또는 runbook을 우선 확인하는 편이 좋습니다.
- `apps/docs`와 `apps/vuln-radar`는 제품 목표와 배포 방식이 달라서, 루트 README는 공통 온보딩 문서 역할에 집중합니다.
