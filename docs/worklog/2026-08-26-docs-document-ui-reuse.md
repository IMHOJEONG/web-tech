# 2026-08-26 Docs Document UI Reuse

## 배경

`/docs` 인덱스 개선 이후 `DocsIndexCard`, 허브의 `MainCard`, 카테고리의 `CategoryDocumentCard`가 비슷한 문서 메타와 썸네일 처리를 반복하고 있었다.

카드 전체를 하나로 합치면 `/feed`, `/docs`, 채널 허브의 화면 성격이 흐려질 수 있으므로, 반복되는 작은 UI 단위만 먼저 분리했다.

## 변경

- `DocumentThumbnail`을 추가했다.
  - 일반 문서 fallback과 로컬 문서 fallback을 선택할 수 있게 했다.
  - `next/image`의 blur placeholder, `sizes`, `priority`, `unoptimized` 옵션을 카드별로 주입할 수 있게 했다.
- `DocumentDateText`를 추가했다.
  - 문서 날짜 표시가 모두 `getTime()` 포맷을 사용하도록 정리했다.
- `DocumentMetaPills`를 추가했다.
  - source, read time, topic, tag 같은 보조 메타를 낮은 시각 강도의 pill로 표시한다.
  - i18n 메시지는 호출부에서 주입하도록 하여 shared UI가 locale context에 직접 의존하지 않게 했다.
- `DocsIndexCard`, `MainCard`, `CategoryDocumentCard`가 공통 UI를 사용하도록 변경했다.

## 결정

- 카드 전체 컴포넌트는 아직 공통화하지 않는다.
- `/docs`는 검색/색인 중심, 허브는 채널 탐색 중심, `/feed`는 큐레이션 중심이므로 화면별 카드 레이아웃은 유지한다.
- 공통화 대상은 썸네일 fallback, 날짜 포맷, 보조 메타 표시처럼 의미가 반복되는 부분으로 제한한다.

## 검증 예정

- `pnpm --filter docs lint`
- `node --experimental-strip-types --test apps/docs/widgets/docs-index/model/*.test.ts apps/docs/lib/docs-search-page-state.test.ts apps/docs/lib/search-result-contract.test.ts apps/docs/lib/search-api-response.test.ts apps/docs/lib/search-preview.test.ts`
- `./node_modules/.bin/tsc --noEmit --project apps/docs/tsconfig.json`

## 관련 문서

- `docs/architecture/docs-document-ui-reuse-policy.md`
- `docs/worklog/2026-08-26-docs-index-browse-controls.md`
