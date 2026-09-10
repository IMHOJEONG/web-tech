# PR 30 Remote HTML Sanitizer Security

## Context

PR #30의 CodeQL 검사에서 `apps/docs/lib/remote-html-sanitizer.ts`에 `Incomplete multi-character sanitization` 3건이 보고됐다.

정규식으로 위험 블록, HTML 주석, 일반 태그를 순서대로 제거하면 앞 단계에서 분리되어 있던 문자열 경계가 합쳐질 수 있다. 이 방식은 새 `<!--` 또는 `<script` 토큰이 만들어지는 변형 입력을 모든 조합에 대해 안전하게 처리한다고 보장하기 어렵다.

## Decision

- 직접 작성한 정규식 HTML sanitizer를 폐기한다.
- 최신 보안 수정이 반영된 parser 기반 `sanitize-html@2.17.7`을 사용한다.
- 허용 태그, 속성, URL scheme을 명시하는 allowlist 정책은 유지한다.
- 허용되지 않은 태그와 그 내용은 `completelyDiscard`로 제거한다.
- 텍스트와 코드 추출은 parser가 태그만 제거하도록 별도 `discard` 설정을 사용한다.
- `target="_blank"` 링크에는 `rel="noopener noreferrer"`를 강제한다.

## Runtime Compatibility

과거 `sanitize-html` 제거의 직접 계기는 `postcss@8.5.26`이 CommonJS에서 `nanoid@6` ESM 모듈을 불러오며 발생한 SSR 오류였다.

루트 override의 `nanoid` 범위를 `>=3.3.18 <4`로 제한해 보안 최소 버전을 지키면서 `postcss`가 기대하는 CommonJS 호환 major를 사용한다. 현재 lockfile은 다음 조합을 고정한다.

- `sanitize-html@2.17.7`
- `postcss@8.5.26`
- `nanoid@3.3.18`

## Regression Coverage

- 주석 경계에 분리된 위험 태그가 실행 가능한 태그로 재구성되지 않는지 확인한다.
- `javascript:` URL과 `on*` 이벤트 속성이 제거되는지 확인한다.
- 안전한 외부 링크, 이미지, 코드 블록, TOC, callout 동작이 유지되는지 확인한다.
- void element의 parser 직렬화 결과인 `<img />`를 렌더링 계약에 반영한다.

## Validation

```bash
CI=true mise exec -- pnpm install --frozen-lockfile
CI=true mise exec -- pnpm --filter docs lint
CI=true mise exec -- pnpm --filter docs typecheck
CI=true mise exec -- pnpm --filter docs test:lib
CI=true mise exec -- pnpm --filter docs exec next build --webpack
```

검증 결과:

- docs lint 통과
- docs typecheck 통과
- docs lib test 92개 통과
- Webpack production build 및 16개 정적 페이지 생성 통과
- 기본 Turbopack build는 코드 문제가 아니라 Codex sandbox의 worker port binding 제한으로 로컬 검증하지 못했으며, PR CI에서 다시 확인한다.
