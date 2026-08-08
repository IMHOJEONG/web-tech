# 2026-08-08 Docs Remote Strict Validation Search Preview And CI

## What Changed

`apps/docs`의 다음 세 단계를 순서대로 반영했다.

1. remote payload field-level stricter validation
2. search result excerpt / highlight 개선
3. docs lib/content test CI 연결

## Remote Payload Validation

대상 파일:

- `apps/docs/lib/content-api-schema.ts`
- `apps/docs/lib/content-api-schema.test.ts`
- `apps/docs/lib/content-api.ts`

적용 내용:

- blank string을 허용값으로 두지 않고 normalize 후 검증
- `date`, `updatedAt` 계열은 date-like value만 허용
- `readMinutes` 계열은 positive integer-like value만 허용
- `status`는 `draft | published | archived`만 허용
- payload parse 실패 시 issue path를 사람이 읽기 쉬운 문구로 포맷

효과:

- upstream payload가 “대충 비슷한 shape”인 수준을 넘어, 실제 운영 계약에 가까운 값만 통과한다.
- remote contract가 깨졌을 때 원인 파악이 쉬워졌다.

## Search Result Preview

대상 파일:

- `apps/docs/lib/search-preview.ts`
- `apps/docs/lib/search-preview.test.ts`
- `apps/docs/widgets/docs-index/ui/docs-index.tsx`

적용 내용:

- 검색어를 title에 highlight
- summary에 match가 있으면 summary 기반 excerpt 사용
- summary에 match가 없으면 content에서 context excerpt 추출
- HTML escape 후 `<mark>`를 삽입해 XSS 없이 highlight 처리

효과:

- 사용자가 “왜 이 문서가 검색 결과로 나왔는지”를 더 빠르게 이해할 수 있다.
- 검색 결과가 단순 목록보다 탐색 도구에 더 가까워졌다.

## CI Integration

대상 파일:

- `.github/workflows/ci.yml`

적용 내용:

- 기존 `pnpm test` 이후에 아래 스텝 추가
  - `pnpm --filter docs test:content`
  - `pnpm --filter docs test:lib`

효과:

- `turbo test`만으로는 비어 있던 docs 테스트 경로를 CI가 놓치지 않게 됐다.
- 로컬에서만 돌던 docs 품질 게이트가 PR/branch 레벨에서도 보장된다.

## Verification

실행한 검증:

- `node --experimental-strip-types --test apps/docs/lib/*.test.ts`
- `node --test apps/docs/scripts/validate-content.test.mjs`
- `node apps/docs/scripts/validate-content.mjs`

결과:

- docs lib test 총 `32`개 통과
- content validation test `5`개 통과
- local content frontmatter validation 통과

## Follow-Up

다음 우선순위 후보:

1. search result ranking + preview를 API route 응답에도 확장할지 검토
2. remote payload schema failure를 운영 로그/알림과 연결할지 검토
3. excerpt highlight의 디자인 토큰 표현을 더 다듬을지 검토
