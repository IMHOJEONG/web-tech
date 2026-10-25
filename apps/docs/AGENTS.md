<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Monorepo Rules

Also follow the workspace-level guide at `../../AGENTS.md`.

## 블로그 기고의 로컬 검증

- 글을 새로 작성하거나 예제를 수정할 때마다 주제에 맞는 로컬 테스트 저장소와
  원문 코드 바인딩을 연결합니다. HTTP 스트리밍 글의 현재 테스트 저장소는
  `/Users/coder/Desktop/project/labs/streaming-backpressure-lab`입니다.
- 복제한 예제만 실행하지 말고 MDX의 실제 실행 코드도 추출해 타입·동작을
  검사합니다. 누락·중복 코드 블록이나 실행 실패는 검사 실패로 처리합니다.
- 기술 정확성, 초보자 관심도·이해, 한국어 존댓말을 다중 에이전트로 검토하고
  지적을 반영합니다. 예제와 도식이 바뀌면 관련 검토와 검사를 다시 수행합니다.
- 공개 블로그 본문에는 테스트 저장소 이름·로컬 경로·전용 검사 명령을 넣지 않습니다.
  독자용 독립 실행 예제, 실제 관측 결과, 검증 범위와 한계는 설명할 수 있습니다.
- 새 글은 사용자 검토와 명시적인 게시 승인 전까지 draft로 유지하며
  스테이징·커밋·푸시·게시하지 않습니다.
