# 2026-08-08 Docs Contributor Guide And Published Metadata Validation

## What Changed

`apps/docs`의 published 문서가 최소 editorial metadata를 항상 갖추도록 local validation 기준을 강화했다.
동시에 작성자가 바로 참고할 수 있는 contributor guide를 별도 runbook으로 분리했다.

## Implementation

### 1. Validation Rule Tightening

`apps/docs/scripts/validate-content.mjs`

- `status`를 모든 문서에서 명시하도록 변경
- published 문서에 아래 필드를 필수로 강제
  - `updatedAt`
  - `authorName`
  - `authorRole`
  - `readMinutes`
  - `topicLabel`
- `readMinutes`는 양의 정수만 허용하도록 검증 추가

### 2. Existing Published Content Alignment

현재 공개 중인 local 문서들에 아래 메타를 채웠다.

- `status: published`
- `updatedAt`
- `authorName`
- `authorRole`
- `readMinutes`
- `topicLabel`
- `tags`

### 3. Contributor Guide Canonicalization

새 문서:

- `docs/runbooks/docs-contributor-guide.md`

정리 범위:

- 콘텐츠 배치 위치
- `slug` / `topicLabel` / `tags` 규칙
- published frontmatter 필수 필드
- draft 시작 규칙
- 이미지 ownership
- publish 전 체크리스트
- local validation command

## Why

이전에는 published 문서라도 최소 식별 필드만 채워져 있으면 통과할 수 있었다.
그 상태에서는 카드/검색/상세 메타 품질이 문서마다 들쭉날쭉해질 수 있었다.

이번 변경으로:

- 작성 규칙이 문서/코드 양쪽에서 같은 방향으로 닫히고
- 새 글 추가 시 메타 누락을 더 이른 단계에서 잡을 수 있고
- contributor onboarding 문서가 실제 운영 기준에 가까워졌다.

## Follow-Up

- placeholder slug나 임시 파일 경로를 더 엄격하게 정리할지 검토
- `tags` 형식도 validator에서 강제할지 검토
- remote payload 측도 같은 수준의 editorial metadata completeness를 권장 규칙으로 끌어올릴지 검토
