# Docs Authoring Marker Validation

## Background

remote 문서의 `4-3. 페인트(Paint)` 섹션에서 `<!-- 작성중 →` 문자열이 사용자 화면에 그대로 노출됐다.

## Cause

- 원문은 HTML 주석 시작 기호 `<!--`를 사용했지만 ASCII 닫힘 기호 `-->` 대신 Unicode 화살표 `→`로 끝났다.
- docs-backend renderer는 raw HTML을 비활성화하므로 HTML 형태의 편집 메모를 공개 본문에서 안전하게 숨긴다고 가정할 수 없다.
- 기존 content style validator는 heading, code fence, callout은 검사했지만 HTML 주석은 검사하지 않았다.
- 해당 문서는 remote NAS 콘텐츠이므로 local docs build validation 경계 밖에 있었다.

## Changes

- local content style validator가 코드 블록 밖의 HTML 주석을 hard fail 처리하도록 확장했다.
- 닫히지 않은 주석과 짝이 없는 닫힘 기호를 구분해 오류 위치를 출력한다.
- HTML 주석 문법을 설명하는 fenced code example은 허용한다.
- contributor guide와 authoring markup policy에 `status: draft` 중심의 작성 규칙을 추가했다.
- remote publish pipeline에 동일 검증을 연결하는 작업을 후속 TODO로 남겼다.

## Immediate Remote Content Fix

NAS 원문의 `<!-- 작성중 →` 줄은 삭제하고, 문서가 미완성이면 frontmatter를 아래처럼 변경한다.

```md
status: draft
```

본문을 공개해야 한다면 해당 섹션을 완성한 뒤 `status: published`를 유지한다. HTML 주석으로 편집 상태를 숨기지 않는다.

## Verification

```bash
node --test apps/docs/scripts/validate-content-style.test.mjs
pnpm --filter docs validate:content
```
