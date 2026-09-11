# Docs Content Authoring Markup Policy

## Status

Adopted on 2026-09-11.

## Purpose

local MDX와 remote Markdown이 서로 다른 renderer를 통과하더라도 편집용 문구가 사용자 화면에 노출되지 않도록 본문 작성 규칙과 검증 경계를 고정한다.

## Publication State

문서 상태는 frontmatter의 `status`만 사용한다.

- `draft`: 작성 또는 검토 중이며 공개 목록에서 제외한다.
- `published`: 필수 metadata와 본문 검증을 통과한 공개 문서다.
- `archived`: 더 이상 공개하지 않는 문서다.

본문에 `작성중`, `WIP`, `TODO` 같은 문자열을 넣어 공개 상태를 표현하지 않는다. 미완성 섹션이 있으면 문서 전체를 `draft`로 유지하거나 해당 섹션을 완성한 뒤 게시한다.

## HTML Comments

본문에서는 HTML 주석을 사용하지 않는다.

```md
<!-- 작성 중 -->
```

금지하는 이유:

- docs-backend의 Markdown renderer는 raw HTML을 비활성화해 주석 문법도 화면에 문자열로 나타날 수 있다.
- `-->` 대신 Unicode 화살표 `→` 등을 사용하면 주석이 닫히지 않아 일반 본문처럼 노출된다.
- local MDX와 remote Markdown의 HTML 처리 차이 때문에 결과가 달라질 수 있다.
- 문서 상태와 작업 메모가 본문에 섞이면 게시 검토 기준이 불명확해진다.

HTML 주석 문법 자체를 설명하는 글에서는 언어가 지정된 코드 블록 안에만 작성한다.

````md
```html
<!-- 이 주석은 코드 예시입니다. -->
```
````

## Reader-Facing Notes

독자가 읽어야 하는 안내는 숨겨진 편집 메모가 아니라 callout으로 작성한다.

```md
> [!NOTE]
> 이 API는 현재 실험 단계이며 production 적용 전 호환성 검토가 필요합니다.
```

지원 marker는 `NOTE`, `TIP`, `WARNING`이다.

## Validation Boundary

local 콘텐츠는 아래 명령으로 검증한다.

```bash
pnpm --filter docs validate:content
pnpm --filter docs test:content
```

검사기는 코드 블록 밖에서 다음 항목을 hard fail로 처리한다.

- 닫히지 않은 `<!--` 주석
- 시작 기호 없이 사용된 `-->`
- 정상적으로 닫혔더라도 본문에 포함된 HTML 주석

remote NAS 콘텐츠는 `apps/docs` 빌드에 포함되지 않으므로 이 검사만으로 차단되지 않는다. remote publish pipeline 또는 docs-backend에 동일한 body validation을 연결하기 전까지는 게시 전 명령을 콘텐츠 checkout에서 별도로 실행해야 한다.

## Review Checklist

1. 공개 상태가 frontmatter `status`에만 표현되어 있는지 확인한다.
2. 본문과 이미지 caption에 편집용 문구가 남지 않았는지 확인한다.
3. 독자 안내가 callout으로 작성되어 있는지 확인한다.
4. 코드 예제의 HTML 주석이 fenced code block 안에 있는지 확인한다.
5. local validation을 통과한 뒤 remote publish와 cache revalidation을 실행한다.

## Related Docs

- `docs/runbooks/docs-contributor-guide.md`
- `docs/architecture/docs-content-authoring-pipeline.md`
- `docs/architecture/docs-article-rendering-convergence.md`
