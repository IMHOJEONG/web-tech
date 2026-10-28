# Diff 코드 블록 표시 검증

## 대상과 조건

- 2026-10-28 Asia/Seoul, [KAN-45](https://web-tech-service.atlassian.net/browse/KAN-45).
- main `e2126a40c02694d968f62ce0e236ec0945a57d7b` 기반 `codex/docs-diff-code-block-20261028`에서 최초 실행 당시의 로컬 미커밋 검증이다. Node 24.22.1·pnpm 12.14.0·Playwright Chromium. 후속 커밋·PR·원격 검사는 작업 기록과 같은 Jira에서 구분한다.
- 1280×800·390×844, 두 테마 및 JS 비활성 320px. 운영 API·NAS·공개 초안은 수정하지 않았다.

## 재현 방법

저장소 루트에서 잠긴 의존성을 설치한 뒤 실행한다. 브라우저 검사는 실제 MDX pre 컴포넌트를 독립 번들로 띄우며 개발 서버·외부 API를 필요로 하지 않는다.

```bash
mise exec -- pnpm --filter docs test:lib
mise exec -- pnpm --filter docs test:code-block
mise exec -- pnpm --filter docs typecheck
mise exec -- pnpm --filter docs exec eslint mdx-components.tsx lib/shiki-options.js lib/render-article-content.test.ts feature/code-block/lib/highlight-code.ts feature/code-block/lib/highlight-code.test.ts code-block-e2e/diff-fixture.tsx code-block-e2e/code-diff.spec.ts --max-warnings 0
```

## 결과와 증거

- Node 라이브러리·콘텐츠 회귀 **315 통과**, 실패/skip 0. diff/patch·대소문자·CRLF/빈 행·HTML escape·일반 연산자 비오인·파일 헤더·hunk·전체/미리보기를 포함한다.
- 실제 MDX 파이프라인은 codeHighlight false/true 모두 언어 클래스가 남는지 검사했다. Shiki가 언어 클래스를 제거하는 기존 동작을 별도 실행으로 확인한 뒤 transformer로 보존했다.
- 코드 블록 브라우저 회귀 **22 통과**, 실패/skip/retry 0. 새 diff 6개와 기존 접기/복사/320px 글자 확대 16개를 함께 실행했다. 로컬·Shiki·원격의 색/배경·기호·행 간격·원문 복사·키보드 접기·고대비 경계선·페이지 가로 넘침을 검사했다.
- 앱 typecheck와 변경 TS/TSX/JS 7파일 ESLint 경고0 통과. 전역 포맷·공통 설정·새 의존성은 변경하지 않았다.
- [정제 결과](../artifacts/2026-10-28-diff-code-block.json)에 조건·명령·중간 실패를 보존했다. PNG는 Playwright의 로컬 test-results에 생성했고 desktop/mobile을 직접 확인했다.

초기 테스트 3개는 코드 원문 비교에 기존 원격 sanitizer를 써 CRLF 정규화·끝 공백 제거를 잘못 요구해 실패했다. 이 검사는 span 제거 후 entity만 해독하도록 바꿔 원본 byte 문자열의 CRLF·끝 개행 보존을 직접 검증했다. 초기 브라우저 4개는 실제 pre를 가져오며 함께 번들된 Next Image의 `process.env` 대체 누락으로 렌더링 전 실패했다. 테스트 번들에만 env 치환을 적용했고 앱 코드를 우회하지 않았다. 관련 ESLint의 연속 공백 경고 2개는 정규식의 ` {4}`로 고쳤다.

## 한계와 후속 작업

실기기·Safari/Firefox·전체 WCAG·운영 배포·production build는 최초 검증 범위 밖이다. 글의 언어 표기가 없으면 diff를 자동 추측하지 않는다. 원격 sanitizer의 기존 LF 정규화·끝 공백 제거 정책은 바꾸지 않았다. 위 실행 당시에는 커밋·푸시·PR을 만들지 않았으며, 후속 사용자 승인으로 이번 수정만 별도 PR에 분리한다.

전용 코드 블록 브라우저 22개는 현재 CI의 직접 호출 대상이 아니다. 원격 CI의 라이브러리·반응형·상세 회귀 성공과 이 로컬 전용 실행을 구분한다. 공통 CI 설정은 이번 범위에서 변경하지 않는다.

공개 데이터 계약·컴포넌트 책임·캐싱은 바꾸지 않는 표시 보완으로 새 ADR을 추가하지 않는다.

## 관련 문서

- [작성 규칙](../../architecture/docs-content-authoring-markup-policy.md#코드-변경분-표시)
- [작업 기록](../../worklog/2026-10/2026-10-28-diff-code-block.md)
