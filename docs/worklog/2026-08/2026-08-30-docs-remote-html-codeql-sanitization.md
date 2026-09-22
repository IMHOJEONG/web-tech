# 2026-08-30 Docs Remote HTML CodeQL Sanitization

## 배경

PR #25에서 CodeQL이 remote article HTML 정규화 로직에 대해 두 가지 경고를 냈다.

- Incomplete multi-character sanitization
- Double escaping or unescaping

원인은 `normalizeRemoteArticleHtml()` 내부에서 HTML 문자열을 regex로 태그 제거하고, entity를 직접 unescape한 뒤 다시 HTML 문자열로 조합하던 구조였다.

## 적용 내용

- `stripHtmlTags()`와 `decodeHtmlEntities()`를 제거했다.
- plain text 추출은 `sanitize-html` 기반 `toPlainText()` / `toCodeText()`로 통일했다.
- remote HTML 본문 sanitize 책임은 `normalizeRemoteContent()`에 유지하고, article normalize 단계는 이미 sanitize된 HTML을 레이아웃 계약에 맞게 변환한다.
- raw `<script>`가 `normalizeRemoteContent()`에서 제거되고, 코드 블록 안의 escaped HTML은 실행 가능한 태그가 아니라 하이라이트된 코드 텍스트로 렌더링되는 회귀 테스트를 추가했다.

## 정책

- 원격 HTML은 문자열 regex만으로 신뢰하지 않는다.
- `dangerouslySetInnerHTML` 경로에 들어가는 값은 parser/sanitizer 기반 정규화를 통과해야 한다.
- 코드 블록 내부 텍스트는 실행 가능한 HTML이 아니라 escaped code markup으로만 출력한다.
- 같은 HTML을 여러 단계에서 반복 sanitize하면 코드 예제의 entity가 이중 escape될 수 있으므로, 원격 본문 sanitize는 수신 경계에서 한 번 수행한다.

## 검증

- `pnpm --filter docs test:lib`
- `pnpm --filter docs lint`
- `pnpm --filter docs typecheck`
