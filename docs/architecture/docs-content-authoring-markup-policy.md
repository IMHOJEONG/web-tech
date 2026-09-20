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

## 독립적으로 읽히는 본문

공개 글은 독자가 이 블로그의 코드 저장소나 개발 환경을 모른다는 전제로 작성한다.

- 저장소에 무엇을 추가했는지, 내부 파일이 어디 있는지, 저장소 전용 명령어로 어떻게 실행하는지는 운영 문서나 예제 README에 둔다.
- 실험 글에는 비교 조건, 관찰 방법, 결과와 한계를 남긴다. 제공하지 않은 도구가 독자에게 이미 준비되어 있다고 가정하지 않는다.
- 독자가 접근할 수 있는 실험 페이지, 주제 설명에 필요한 코드와 일반적인 실행 명령은 유지할 수 있다.
- 기술 주제인 저장소·서버·프로젝트 자체를 금칙어로 취급하지 않는다. 내부 작업 안내가 본문에 섞였는지를 문맥으로 검토한다.

이 기준은 편집 검토 규칙이며 현재 자동 검사기가 보장하는 항목은 아니다.

## 독해와 편집 검토

문법 검증과 별도로 공개 전 다음 내용을 사람이 읽고 확인한다. 짧은 노트와 체크리스트를 무조건 장문 튜토리얼로 늘리지 않는다.

- 독자와 사전 지식: 누구를 위한 글인지, 어떤 용어를 이미 알아야 하는지 드러난다.
- 제목과 요약: 본문이 실제로 답하는 범위만 약속한다. 짧은 메모에 심층 설명을 약속하지 않는다.
- 설명 흐름: 주장과 이유를 문단으로 연결하고, 목록은 단계·비교·점검 항목에 사용한다.
- 용어: 핵심 용어는 첫 등장에 풀어 쓰고 이후 같은 표현을 사용한다. 코드/API 식별자는 원문을 유지한다.
- 재현성: 실험·해결 글에는 환경, 실행 방법, 관찰한 결과와 미검증 범위를 구분한다. 실행하지 않은 결과를 채워 넣지 않는다.
- 마무리: 독자가 무엇을 이해하거나 다음에 실행할지 알 수 있다. 참고 섹션에는 실제 출처를 연결한다.

문장 길이·영어 비율·예제 부재 등은 편집 검토를 돕는 신호일 뿐 hard fail이나 가독성 점수로 사용하지 않는다. readMinutes도 실측 이해 시간을 보장하지 않는다. 실제 독해 검증은 대상 독자가 글의 핵심을 요약하거나 안내한 작업을 수행할 수 있는지 관찰해야 한다.

[2026-09-20 공개 글 편집 검토](../verification/content/2026-09-20-content-readability-review.md)는 원문 읽기 평가이며 사용자 테스트나 브라우저 시각 검증 결과가 아니다.

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
