<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Monorepo Rules

Also follow the workspace-level guide at `../../AGENTS.md`.

## 블로그 출처와 저작권

- 새로 작성하거나 본문·예제를 갱신하는 블로그 글의 끝에 참고 자료와 저작권 안내를
  명시합니다. 참고한 원문은 제목·작성 주체·링크와 함께 제공하고, 해당 자료가
  어떤 내용의 근거인지 밝힙니다.
- 외부 글·코드·이미지·도식을 복제하거나 수정해 사용할 때에는 권리자와
  라이선스·허용 범위·표시 의무를 확인하고, 글에 출처·권리자·라이선스와
  변경 범위를 표시하며 필요한 저작권 고지와 라이선스 전문을 포함합니다.
- 단순한 링크 제공과 타인 저작물의 복제·수정을 구분합니다. 다른 자료의 권리를
  블로그의 라이선스로 임의로 통합하거나, 확인하지 않은 권리·허가를 추정하지
  않습니다. 직접 만든 도식과 제3자 자료의 경계도 밝혀 둡니다.

## 블로그 기고의 로컬 검증

- 글을 새로 작성하거나 예제를 수정할 때마다 주제에 맞는 로컬 테스트 저장소와
  원문 코드 바인딩을 연결합니다. 개인 실험실 경로·원시 데이터는 저장소 밖
  비공개 작업 기록에서 관리하며 공개 지침에 실제 개인 경로를 적지 않습니다.
- 복제한 예제만 실행하지 말고 MDX의 실제 실행 코드도 추출해 타입·동작을
  검사합니다. 누락·중복 코드 블록이나 실행 실패는 검사 실패로 처리합니다.
- 기술 정확성, 초보자 관심도·이해, 한국어 존댓말을 다중 에이전트로 검토하고
  지적을 반영합니다. 예제와 도식이 바뀌면 관련 검토와 검사를 다시 수행합니다.
- 공개 블로그 본문에는 테스트 저장소 이름·로컬 경로·전용 검사 명령을 넣지 않습니다.
  독자용 독립 실행 예제, 실제 관측 결과, 검증 범위와 한계는 설명할 수 있습니다.
- 새 글은 사용자 검토와 명시적인 게시 승인 전까지 draft로 유지하며
  스테이징·커밋·푸시·게시하지 않습니다.

## 공개 검수

- `draft`와 `.gitignore`는 비밀정보 보관 장치가 아닙니다. 비공개 글·실험 데이터·
  실제 응답·로그·녹화본·자격 증명은 저장소 밖에서 작성·보관합니다.
- [공개 검수 절차](../../docs/process/publication-review.md)에 따라 사용자에게
  공개할 파일과 범위를 확인받고, 확정된 bytes의 검수 기록을 남깁니다.
  에이전트가 게시 승인이나 `.publication-review.json`의 실제 승인 항목을
  임의로 생성·갱신하지 않습니다. 실제 이미지·영상에는 별도 육안 검수가 필요합니다.
- 합성 fixture·재현 테스트 코드는 공개 가능하지만 원시 실험 데이터와 구분합니다.
  정제된 증거도 명시적 공개 검수 전에는 커밋하지 않습니다.
