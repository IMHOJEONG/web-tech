# Docs Contributor Guide

## Purpose

이 문서는 `apps/docs` 블로그 글을 새로 추가하거나 수정할 때 따라야 하는 contributor 기준을 정리한다.

핵심 목표:

- 글 위치와 라우팅 규칙을 혼동하지 않는다.
- published 문서는 카드/검색/상세에 필요한 editorial metadata를 항상 갖춘다.
- publish 전에 로컬 검증으로 실수를 최대한 빨리 잡는다.

## Content Placement

문서는 현재 두 계층에서 관리한다.

- `apps/docs/data/*`
  - 현재 메인 docs 채널에서 직접 노출되는 문서
  - 원격 문서 서버 장애 시에도 보여줄 evergreen fallback 문서
  - 예: browser runtime, accessibility, rendering, UI behavior
- `apps/docs/category/*`
  - taxonomy 실험 또는 세부 카테고리 문서
  - FE / BE / Computer Science 같은 학습 축의 기준 문서
- remote content server
  - 앱 배포 없이 운영 중 추가/수정할 문서
  - 최신 글, 실험 기록, 이미지가 자주 바뀌는 글

기본 원칙:

- 파일명보다 `frontmatter.slug`가 leaf slug의 기준이다.
- 실제 canonical route 계산은 파일 경로와 `slug`를 함께 사용하므로, 임시 폴더명이나 테스트용 구조를 오래 유지하지 않는다.
- published 문서는 가능한 한 실제 채널 의미가 드러나는 폴더에 둔다.
- 앱 코드와 함께 리뷰되어야 하거나 원격 장애 시에도 반드시 보여야 하는 글은 local에 둔다.
- 빠르게 발행/수정해야 하거나 asset 변경이 잦은 글은 remote에 둔다.
- 같은 route의 local/remote 문서가 동시에 있으면 remote 문서를 우선 노출한다.

## Naming Rules

### Slug

- `slug`는 lowercase kebab-case만 허용한다.
- 공백, 대문자, `_`, `/`는 허용하지 않는다.
- 예: `rendering-pipeline`, `drawer-aria-error`

### Topic Label

- `topicLabel`은 카드/상세 상단에서 쓰이는 짧은 분류 라벨이다.
- 1~2단어 수준의 짧은 표현을 권장한다.
- 예: `WEB`, `ACCESSIBILITY`, `RUNTIME`, `MOBILE`

### Tags

- `tags`는 검색/추천/후속 taxonomy 확장용 메타다.
- 2~5개 정도의 짧은 키워드를 권장한다.
- 예: `rendering`, `browser`, `aria`

## Required Frontmatter For Published Content

published 문서는 아래 필드를 모두 명시한다.

```md
---
title: "Rendering Pipeline"
slug: "rendering-pipeline"
summary: "브라우저 렌더링 파이프라인을 단계별로 정리한다."
date: "2026-08-08"
updatedAt: "2026-08-08"
thumbnail: "web/rendering-pipeline/hero.webp"
authorName: "HoJeong Im"
authorRole: "Web Engineer"
readMinutes: 7
topicLabel: "WEB"
tags:
  - rendering
  - browser
status: "published"
---
```

필수 기준:

- `title`
- `slug`
- `summary`
- `date`
- `updatedAt`
- `authorName`
- `authorRole`
- `readMinutes`
- `topicLabel`
- `status: published`

권장 기준:

- `thumbnail`
- `tags`

추가 규칙:

- `readMinutes`는 양의 정수만 허용한다.
- `date`, `updatedAt`은 날짜로 파싱 가능한 문자열이어야 한다.
- `status`는 `draft`, `published`, `archived`만 허용한다.

## Draft Content Rules

초안 문서는 아래처럼 더 가볍게 시작해도 된다.

```md
---
title: "OS Scheduling Notes"
slug: "os-scheduling-notes"
status: "draft"
---
```

단, 초안이라도 아래는 지키는 편이 좋다.

- `title`
- `slug`
- `status`

초안이 published로 올라가기 전에는 published 필수 메타를 모두 채운다.

## Image Ownership

이미지는 성격에 따라 관리 위치를 나눈다.

- 콘텐츠 이미지
  - 글 본문과 함께 배포되는 asset
  - remote content asset base 또는 글 전용 asset storage에서 관리
- 앱 UI 이미지
  - 로고, 기본 OG, placeholder, shell 장식
  - `apps/docs/public` 또는 프론트 자산 체계에서 관리

원칙:

- 콘텐츠 이미지와 앱 UI 이미지를 같은 책임으로 섞지 않는다.
- 본문 이미지 경로는 글 이동 후에도 예측 가능하게 유지한다.

## Article Element Rules

본문 요소는 local MDX와 remote HTML/markdown의 최종 UI가 달라지지 않도록 아래 문법을 우선 사용한다.

### Callout

주의, 팁, 참고 박스는 blockquote marker 문법으로 작성한다.

```md
> [!NOTE]
> 배경 설명이나 읽기 전에 알면 좋은 맥락을 적습니다.

> [!TIP]
> 바로 적용할 수 있는 실무 팁을 적습니다.

> [!WARNING]
> 장애, 보안, 성능 저하처럼 조심해야 할 내용을 적습니다.
```

규칙:

- 지원 marker는 `[!NOTE]`, `[!TIP]`, `[!WARNING]`만 사용한다.
- marker는 blockquote의 첫 텍스트로 둔다.
- 일반 인용문은 marker 없이 `>`만 사용한다.

### Table

표는 markdown table을 사용한다.

```md
| Source | Role                 |
| ------ | -------------------- |
| local  | fallback / evergreen |
| remote | operational content  |
```

규칙:

- 긴 표는 모바일에서 표 영역 내부만 가로 스크롤된다.
- 표 안에는 너무 긴 URL이나 코드 전체를 그대로 넣지 말고 요약 후 링크로 분리한다.

## Pre-Publish Checklist

글을 올리기 전 아래를 확인한다.

1. `slug`가 실제 주제를 설명하는지 확인
2. `summary`가 검색/카드에서 바로 읽히는지 확인
3. `topicLabel`이 카드 상단 라벨로 자연스러운지 확인
4. 썸네일/본문 이미지 경로가 깨지지 않는지 확인
5. heading 구조가 `h2`, `h3` 기준으로 TOC에 자연스럽게 잡히는지 확인
6. draft 문서를 실수로 published로 바꾸지 않았는지 확인

## Content Style Rules

`apps/docs`는 frontmatter 외에도 최소한의 문서 형식을 검사한다.

Hard fail:

- `apps/docs/data`, `apps/docs/category` 아래에는 `md`, `mdx` 문서만 둔다.
- `# h1`은 사용하지 않는다. 페이지 제목은 frontmatter `title`이 담당한다.
- 첫 heading은 `##` 또는 `###`로 시작한다.
- heading level을 한 번에 두 단계 이상 건너뛰지 않는다.
- 코드 블록은 언어를 명시한다.
- 코드 블록은 반드시 닫는다.
- callout marker는 blockquote의 첫 텍스트로만 사용한다.
- 지원하지 않는 callout marker를 사용하지 않는다.

Warning:

- published 문서 본문이 비어 있는 경우
- published 문서에 `TODO`, `FIXME`, `임시`, `테스트용` 같은 placeholder 표현이 남은 경우
- published 문서 slug가 `test`, `sample`, `todo`, `draft` 같은 임시값인 경우

## Local Validation Commands

로컬에서 최소 아래 명령을 권장한다.

```bash
pnpm --filter docs test:content
pnpm --filter docs test:lib
pnpm --filter docs dev
```

역할:

- `test:content`
  - frontmatter 규칙 검증
- `test:lib`
  - route/search/render 관련 회귀 검증
- `dev`
  - 실제 카드/상세/검색 노출 확인

## Common Mistakes

- `status`를 빼먹어서 published 기준이 모호해지는 경우
- `slug: test`처럼 임시 slug가 오래 남는 경우
- `updatedAt`을 수정하지 않아 최신성 정보가 틀어지는 경우
- `readMinutes` 없이 카드 메타가 어색해지는 경우
- 콘텐츠 이미지와 UI 이미지를 같은 경로 책임으로 다루는 경우

## Related Docs

- [docs-content-authoring-pipeline.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-content-authoring-pipeline.md)
- [docs-local-vs-remote-content-policy.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-local-vs-remote-content-policy.md)
- [docs-blog-improvement-roadmap.md](/Users/coder/Desktop/project/web-tech/docs/architecture/docs-blog-improvement-roadmap.md)
- [blog-content-api-contract.md](/Users/coder/Desktop/project/web-tech/docs/architecture/blog-content-api-contract.md)
