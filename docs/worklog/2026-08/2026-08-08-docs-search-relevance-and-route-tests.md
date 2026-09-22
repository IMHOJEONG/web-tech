# 2026-08-08 Docs Search Relevance And Route Tests

## What Changed

`apps/docs` 검색 품질과 content routing 안전장치를 코드/테스트 기준으로 한 단계 올렸다.

이번 작업 범위:

- canonical doc route helper 유닛 테스트 추가
- editorial metadata normalize / validation 유닛 테스트 추가
- search relevance scoring 도입
- search ranking 유닛 테스트 추가

## Code Changes

### Route / Metadata Tests

- `apps/docs/lib/get-doc-route.test.ts`
- `apps/docs/lib/editorial-metadata.test.ts`

검증한 내용:

- 요청 route path 정규화
- duplicate leaf collapse (`feed/pna/pna` -> `feed/pna`)
- `markdownPath` 기준 canonical route 계산
- local alias path를 canonical doc route로 수렴
- local / remote editorial metadata alias normalize
- `published` / `draft` status별 validation 차이

### Search Ranking

- `apps/docs/lib/search-ranking.ts`
- `apps/docs/lib/search-ranking.test.ts`
- `apps/docs/lib/get-search-data.ts`

적용 원칙:

- `title` exact / prefix / includes match 최우선
- `summary` match 차순위
- `section`, `slug`, `fileName` taxonomy match 보조 반영
- `content` match는 약한 점수만 부여
- multi-token query는 각 토큰이 문서 어딘가에 모두 있어야 결과 인정
- score 동점이면 최신 문서 우선

즉 기존의 단순 `includes` 필터에서, 실제 탐색 의도에 더 가까운 weighted ranking으로 바뀌었다.

## Why

이전 검색은 아래 한계가 있었다.

- 제목 매치와 본문 매치가 거의 같은 무게로 취급됐다.
- 최신 문서 정렬이 검색 의도보다 앞설 수 있었다.
- route / metadata helper는 정책이 생겼지만 회귀 방지 테스트가 없었다.

이번 작업으로:

- “찾으려던 문서가 먼저 보이는가”를 코드 레벨에서 다룰 수 있게 됐고
- route / frontmatter 정책을 테스트로 고정할 수 있게 됐다.

## Verification

실행한 검증:

- `node --experimental-strip-types --test apps/docs/lib/get-doc-route.test.ts apps/docs/lib/editorial-metadata.test.ts apps/docs/lib/search-ranking.test.ts`
- `node --test apps/docs/scripts/validate-content.test.mjs`
- `node apps/docs/scripts/validate-content.mjs`

결과:

- lib test `14`개 통과
- content validation test `5`개 통과
- local content frontmatter validation 통과

## Follow-Up

다음 우선순위 후보:

1. docs detail render smoke test 추가
2. search excerpt highlight 설계
3. typo tolerance / synonym 정책 검토
