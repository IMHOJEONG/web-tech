# Docs Content Contract

`apps/docs`와 `apps/docs-backend`가 공유하는 콘텐츠 API 계약이다.

- canonical channel과 `markdownPath`
- editorial status
- `published` frontmatter 필수 metadata와 `YYYY-MM-DD` 날짜
- legacy-compatible remote payload parsing
- 신규 NestJS API의 canonical response schema
- published 본문 검색 전용 선택 필드 `searchText` (렌더링 content와 분리, 구형 생산자 호환)
- 전체 목록 JSON의 UTF-8 byte budget 상수 (경고512KiB·상한1MiB, [ADR-0020](../../docs/architecture/adr-0020-content-posts-byte-budget.md)). 스키마 자체가 아닌 생산자 직렬화·소비자 스트림 경계에서 검사한다.
- 상세 HTML의 독립된 UTF-8 byte budget 상수 (경고512KiB·상한1MiB, [ADR-0021](../../docs/architecture/adr-0021-content-html-byte-budget.md)). 전체 렌더 응답·소비자 스트림을 제한하며 HTML을 절단하지 않는다.
- 로컬·원격이 공유하는 본문 작성 규칙 (`@web-tech/docs-content-contract/body-style`)

소비 앱은 경로 정규식이나 상태 enum을 다시 선언하지 않고 이 패키지를 사용한다.

Next.js ESM과 NestJS/Jest CommonJS가 같은 계약을 읽도록 `dist/esm`과 `dist/cjs`를 함께 생성한다.

## Boundary

- `remotePayloadSchema`: 기존 원격 서버 payload를 읽기 위한 호환 입력 계약
- `publishedDocumentFrontmatterSchema`: 새로 게시하는 Markdown의 엄격한 작성 계약
- `canonicalPostsPayloadSchema`: `apps/docs-backend`가 반환하는 엄격한 목록 응답 계약
- `getMarkdownBodyStyleIssues(body, { status, slug })`: frontmatter를 제외한 본문을 검사해 `failures`·`warnings`를 반환하는 순수 함수. 파일 탐색·공개 차단·로깅은 소비 앱의 책임이다.

본문 검사기는 renderer나 HTML sanitizer가 아니다. raw HTML 비활성화 정책을 대체하지 않는다. 작성 규칙과 배포 영향은 [본문 작성 정책](../../docs/architecture/docs-content-authoring-markup-policy.md)을 따른다.

변경 후에는 아래를 실행한다.

```bash
pnpm --filter @web-tech/docs-content-contract lint
pnpm --filter @web-tech/docs-content-contract typecheck
pnpm --filter @web-tech/docs-content-contract test
pnpm --filter @web-tech/docs-content-contract build
```
