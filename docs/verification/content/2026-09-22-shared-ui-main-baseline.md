# 공용 UI main 기준 분리 검증

## 대상과 조건

- 날짜: 2026-09-22 KST.
- 기준: origin/main `c87fe59`, 브랜치 `codex/shared-ui-base-ui`.
- 독립 worktree에서 검사하며 기존 개발 서버와 미커밋 파일을 변경하지 않는다.
- UI 테스트는 headless Chromium의 light/dark 조합이며 실제 서비스 경로 검사는 아니다.

## 재현 방법

```sh
mise exec -- pnpm install --ignore-scripts --frozen-lockfile
mise exec -- pnpm validate:catalog
mise exec -- pnpm --filter docs test:ui
mise exec -- pnpm --filter @web-tech/ui typecheck
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter vuln-radar typecheck
mise exec -- pnpm --filter vuln-radar build
mise exec -- pnpm --filter docs build
```

공유 Git 훅을 이전 main의 자동 포맷 훅으로 바꾸지 않기 위해 이 worktree 설치에서는 scripts를 실행하지 않는다. 공용 UI와 콘텐츠 계약 빌드는 각 검사 명령에서 별도로 실행한다.

## 결과와 증거

- UI fixture: 54개 통과, 23.7초. 클래스 병합, Base UI import 경계, 테마·키보드·ref·이벤트·Tooltip 설명 관계를 확인했다.
- 공용 UI·docs·vuln-radar 타입 검사 통과.
- docs production 빌드 통과: Next.js 16.3.4, 컴파일 10.7초, 정적 페이지 16개 생성, 콘텐츠 검사 12개 통과. 운영 환경 변수 없이 로컬 콘텐츠만 사용했다.
- vuln-radar 빌드 통과: Vite 8.2.1, 1,968개 모듈. 기존 config loader의 확장자 경고는 남아 있다.
- frozen install과 catalog 검사 통과: 11개 workspace manifest.

이 결과는 `c87fe59` 위에 공용 UI만 적용한 작업 트리 기준이다. 테스트 산출물은 worktree의 `apps/docs/test-results/ui/`에 생성되며 PR에 올리지 않는다.

## 한계와 후속 작업

- 기존 feature/docs에서의 UI·Activity·production 검증 결과와 별개의 실행이다.
- Prisma Studio 내부 Radix 의존성은 남아 있다. lockfile 존재만으로 브라우저 번들 포함을 단정하지 않는다.
- 실제 Vercel 배포, NAS 연동, Safari·Firefox·스크린 리더, 외부 모노레포는 미검증이다.

## 관련 문서

- [전환 결정](../../architecture/adr-0006-shared-ui-base-ui.md)
- [PR 분리 작업](../../worklog/2026-09/2026-09-22-shared-ui-pr-split.md)
