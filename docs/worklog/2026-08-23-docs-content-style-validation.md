# 2026-08-23 Docs Content Style Validation

## 배경

블로그 글을 추가할 때 frontmatter는 검증하고 있었지만, 본문 형식은 문서마다 달라질 수 있었다.

특히 새 글을 작성할 때 다음 문제가 반복될 수 있다.

- frontmatter 제목과 본문 `h1`이 중복됨
- heading depth가 불규칙함
- 코드 블록에 language가 빠짐
- 실험 HTML 같은 비문서 파일이 `apps/docs/data` 아래에 들어감
- published 문서에 `TODO`, `test`, `임시` 같은 placeholder가 남음

## 변경

- `apps/docs/scripts/validate-content-style.mjs`를 추가했다.
- `apps/docs/scripts/validate-content-style.test.mjs`를 추가했다.
- `pnpm --filter docs validate:content`가 frontmatter와 content style을 함께 검사하도록 변경했다.
- `pnpm --filter docs test:content`가 style validator test와 실제 validation을 함께 실행하도록 변경했다.
- `docs/runbooks/docs-contributor-guide.md`에 content style rule을 추가했다.

## 도입 기준

첫 버전은 hard fail과 warning을 분리한다.

Hard fail:

- content directory 안의 비문서 파일
- `h1` 사용
- 첫 heading이 `h2` 또는 `h3`가 아닌 경우
- heading level jump
- language 없는 코드 블록
- 닫히지 않은 코드 블록

Warning:

- published 문서의 빈 본문
- placeholder-like 표현
- placeholder-like slug

기존 레거시 문서까지 한 번에 모두 막으면 CI 전환 비용이 커지므로, 첫 도입은 명백한 구조 오류만 실패로 처리한다.
