# Monorepo Agent Guide

이 저장소에서 에이전트가 작업할 때 적용하는 공통 기준이다.

## Scope

- 이 파일은 monorepo 전체에 적용한다.
- 하위 디렉터리에 별도 `AGENTS.md`가 있으면 해당 앱/패키지의 추가 규칙으로 함께 본다.
- `CLAUDE.md`는 Claude 계열 도구가 같은 내용을 참조하도록 두는 연결 파일이다.

## Working Rules

- 변경 전 현재 브랜치와 작업 트리 상태를 먼저 확인한다.
- 사용자가 만든 미추적/수정 파일은 명시 요청 없이 삭제하거나 되돌리지 않는다.
- monorepo 루트의 package manager와 lockfile을 기준으로 명령을 실행한다.
- 앱별 빌드/테스트는 가능한 한 해당 workspace filter로 좁혀 실행한다.
- 문서화가 필요한 정책 변경은 `docs/architecture`, 작업 기록은 `docs/worklog`에 남긴다.

## Next.js Apps

Next.js 앱을 수정할 때는 해당 앱 디렉터리의 `AGENTS.md`도 확인한다.

특히 Next.js 최신 버전은 API, 라우팅, 캐싱, 서버/클라이언트 컴포넌트 동작이 빠르게 바뀔 수 있으므로, 기억에만 의존하지 말고 로컬 `node_modules/next/dist/docs/` 문서를 우선 확인한다.
