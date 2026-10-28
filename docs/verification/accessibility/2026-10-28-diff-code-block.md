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

## 실제 개발 서버 후속 확인

사용자의 로컬 화면 확인 요청으로 커밋 `a2e2f271` 이후 실제 Next.js 개발 서버도 실행했다. 독립 컴포넌트 브라우저 검사와 달리 최초 서버는 MDX loader 옵션의 transformer 함수 때문에 Turbopack 직렬화 오류로 종료됐다. 빌드용 Shiki 옵션은 순수 데이터로 유지하고, 본문 평가 경로만 함수가 있는 runtime 옵션을 사용하도록 로컬에서 분리했다. `next.config.mjs`는 변경하지 않았다. loader 옵션의 structured clone·JSON roundtrip 회귀도 추가했다.

- 기존 다른 작업 폴더의 3001 서버는 보존하고 3039에 별도 서버를 실행했다. 원격 목록은 이 서버에서만 비활성화했다.
- 개발 전용 draft preview 경로를 실제 `ArticleContentLayout`으로 렌더링했고 HTTP 200을 확인했다. 임시 문서는 공개 목록·검색에서 제외되며 커밋 대상도 아니다.
- Playwright Chromium으로 1280px·390px × 라이트·다크 4조합을 확인했다. 추가·삭제 구분, patch 언어, 일반 JS 비오인, 긴 코드 키보드 접기·펼치기, 짧은/긴 코드 전체 복사가 통과했다. 복사는 테스트 컨텍스트 메모리로 검증해 OS 클립보드를 읽거나 바꾸지 않았다.
- 페이지 전체 가로 넘침과 브라우저 실행 오류가 없었다. 코드 블록 내부의 긴 줄은 기존 내부 가로 스크롤을 유지한다.
- 후속 Node 회귀는 **316 통과**, 실패·skip 0이다. 앱 typecheck와 변경 3파일 ESLint도 통과했다. 실행 결과 JSON과 4개 화면 캡처는 로컬 임시 경로에 보관했다. production build·배포 성공을 의미하지 않는다.

이 후속 수정은 화면 확인 시점의 미커밋 변경이다. [PR #74](https://github.com/IMHOJEONG/web-tech/pull/74)의 기존 푸시 결과와 구분하며, 원격 CI 결과는 아직 확인 전이다.

## 후속 수정 게시 전 재검증

사용자가 로컬 화면 확인 후 후속 수정의 커밋·푸시를 승인했다. 위 개발 서버 확인은 당시 기록으로 유지한다. 이번 커밋은 loader/runtime 옵션 분리, 직렬화 회귀와 이 검증·작업 기록만 포함하며, 임시 preview draft와 다른 작업 트리의 변경은 제외한다.

`test:lib` 316개·앱 typecheck·변경 3파일 ESLint를 다시 통과했다. 코드 블록 브라우저 재검사 최초 실행은 macOS 샌드박스의 Chromium MachPort 권한 거부로 테스트 시작 전 22개가 실패했다. 앱 표시 실패와 구분하며, 승인된 실행 환경에서 같은 명령·기준으로 재검사해 **22 통과**, 실패·skip·retry 0을 확인했다.

이전 커밋의 [CI 실행 40637088564](https://github.com/IMHOJEONG/web-tech/actions/runs/40637088564)에서는 반응형 3종·오프라인·상세 production·공용 UI consumer가 같은 loader 직렬화 오류로 서버 시작에 실패했다. Unit and Contract Tests는 공용 UI 생성기의 `turbo gen` 하위 프로세스 `ETIMEDOUT`으로 별도 실패했다. 이 후속 수정이 생성기 타임아웃까지 해결한다고 간주하지 않으며, 새 SHA의 CI로 재확인한다. timeout·retry·공통 CI 설정은 변경하지 않는다.

## 관련 문서

- [작성 규칙](../../architecture/docs-content-authoring-markup-policy.md#코드-변경분-표시)
- [작업 기록](../../worklog/2026-10/2026-10-28-diff-code-block.md)
