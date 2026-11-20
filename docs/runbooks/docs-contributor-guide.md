# Docs Contributor Guide

## Purpose

이 문서는 비공개 `IMHOJEONG/heap-forge-content`에서 `apps/docs` 블로그의 초안·발행 원문을 작성할 때 따라야 하는 기준이다. 공개 `web-tech`는 앱 코드·합성 검사·정제 운영 문서의 저장소이며 새 글 원문의 작성 위치가 아니다. 2026-11-20의 지침 변경은 전용 PR로 검토하며 main 반영·게시·운영 검증과 구분한다.

핵심 목표:

- 글 위치와 라우팅 규칙을 혼동하지 않는다.
- published 문서는 카드/검색/상세에 필요한 editorial metadata를 항상 갖춘다.
- publish 전에 로컬 검증으로 실수를 최대한 빨리 잡는다.

## Content Placement

새 초안·발행 원문과 글 전용 자산은 비공개 콘텐츠 저장소의 다음 위치에서 관리한다. 초안 전용 `drafts/` 디렉터리를 새로 만들지 않고 상태를 frontmatter로 구분한다.

| 비공개 저장소 경로                  | 역할                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `category/be/node-js/<slug>.mdx` 등 | 주제별 초안·발행 원문. 기존 taxonomy와 canonical 경로를 유지                                |
| `data/v8/`, `data/shadcn/` 등       | 기존 경로를 유지하는 콘텐츠. 새 분류가 필요한 글은 `category/` 우선                         |
| `public/<topic>/<slug>/` 등         | 글 전용 이미지·도식·필요한 라이선스. 검수된 published 글이 참조하는 자산만 발행 입력에 포함 |

공개 코드의 `apps/docs/data`·`category`에 실제 초안을 복사하거나 새 글 이미지를 `apps/docs/public`에 넣지 않는다. 테스트에는 합성 문서를 사용한다. 기존 공개 원문·초안·stash는 별도 이전·삭제 승인 전 보존하고 과거 이력도 재작성하지 않는다.

기본 원칙:

- `frontmatter.slug`는 문서 메타데이터이며 실제 canonical route는 구조화된 파일 경로를 우선한다. 제목·상태를 바꾼다고 파일 위치까지 자동 변경하지 않는다.
- published 문서는 가능한 한 실제 채널 의미가 드러나는 폴더에 둔다.
- 초안과 발행본의 작성 원본은 모두 비공개 Git에 둔다. NAS는 기존 글의 수동 이전 대상이며 신규 초안의 기본 저장소가 아니다.
- 운영은 승인된 콘텐츠 SHA의 빌드 스냅샷을 사용한다. 비공개 push·원격 API 변경만으로 새 글이 게시되지는 않는다.

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
thumbnail: "/web/rendering-pipeline/hero.webp"
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

비공개 콘텐츠 저장소에서 초안은 아래처럼 시작할 수 있다. 다음 예시는 작성 형식이며 실제 새 글을 만들거나 게시하라는 명령이 아니다.

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

비공개 초안의 수정 이력은 Git으로 관리할 수 있다. 다만 `git add .`·`git push --all`로 다른 변경을 포함하지 않고 사용자에게 요청받은 저장소·파일만 커밋·푸시한다. 비공개 커밋은 공개 검수나 게시 승인이 아니므로 이 단계에서 release lock·게시 검수 해시를 자동 갱신하지 않는다.

게시 순서는 사람 검수·명시적 게시 승인 → `published` 전환과 원문/참조 자산의 검수 해시 등록 → 비공개 콘텐츠 커밋 → 검증된 SHA의 release lock PR → 사람 병합 → 배포·공개 URL/사이트맵 확인이다. [발행 준비 절차](docs-private-git-content.md#초안의-기본-작성-위치)와 [합성/인증 CI 경계](docs-private-content-ci.md)를 따른다. lock PR 자동화는 별도 미푸시 작업이므로 이 지침 PR에 포함하거나 이미 활성화됐다고 안내하지 않는다.

비공개 Git에도 비밀값·실제 API 응답·원시 로그·HAR/pcap·원본 캡처·녹화본·DB dump는 넣지 않는다. 필요한 공개 도식·검증 요약은 원시 자료와 분리하고 별도 검수한다.

### Unfinished Work Markers

작성 중인 상태는 본문에 `작성중`, `WIP`, `TODO` 같은 편집 메모를 넣어 표현하지 않는다. frontmatter의 `status`가 문서 공개 상태의 유일한 기준이다.

```md
---
title: "Rendering Pipeline"
slug: "rendering-pipeline"
status: "draft"
---
```

HTML 주석도 편집 메모 용도로 사용하지 않는다.

```md
<!-- 작성 중 -->
```

remote renderer는 보안을 위해 raw HTML을 비활성화한다. 이 때문에 정상 주석도 화면에 문자열로 나타날 수 있고, `<!-- 작성중 →`처럼 `-->`가 아닌 문자로 닫으면 일반 본문으로 노출된다. 독자에게 필요한 안내는 callout으로 작성하고, 작성자용 작업 메모는 이슈나 작업 문서에서 관리한다.

## Image Ownership

이미지는 성격에 따라 관리 위치를 나눈다.

- 콘텐츠 이미지
  - 글 본문과 함께 배포되는 asset
  - 기본 위치는 비공개 콘텐츠 저장소의 `public/`. 기존 외부 미디어는 공개 범위·권리를 별도 확인
- 앱 UI 이미지
  - 로고, 기본 OG, placeholder, shell 장식
  - `apps/docs/public` 또는 프론트 자산 체계에서 관리

원칙:

- 콘텐츠 이미지와 앱 UI 이미지를 같은 책임으로 섞지 않는다.
- 본문 이미지 경로는 글 이동 후에도 예측 가능하게 유지한다.

## Article Element Rules

본문 요소는 local MDX와 remote HTML/markdown의 최종 UI가 달라지지 않도록 아래 문법을 우선 사용한다.

### 본문 목차

목차는 본문의 제목에서 자동 생성한다. 작성자는 frontmatter `title`과 H2/H3/H4 계층을 정리하고, 글 안에 별도의 수동 목차를 중복 작성하지 않는다. 로컬·원격 공통 범위, 기존 앵커 보존, 모바일 접기 및 검증 코드는 [본문 목차 작성·연결 가이드](docs-article-toc-guide.md)를 따른다.

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
7. 본문에 `작성중`, HTML 주석 같은 편집 메모가 남지 않았는지 확인

## Content Style Rules

`apps/docs`는 frontmatter 외에도 최소한의 문서 형식을 검사한다.

private-git 발행 준비와 로컬 CLI는 기존 frontmatter·본문 규칙을 사용한다. 레거시 NestJS `docs-backend`도 `@web-tech/docs-content-contract/body-style`의 본문 검증기를 공유하지만, 그 API/이미지의 배포는 현재 Git 발행과 별개다. 기존 NAS 경로의 영향은 [배포 전 점검과 캐시 주의점](../architecture/docs-content-authoring-markup-policy.md#배포-영향)을 확인한다.

Hard fail:

- 비공개 `data/`, `category/` 아래에는 `md`, `mdx` 문서만 둔다. 코드 저장소 검사·manifest에서 이 위치는 `apps/docs/data`, `apps/docs/category`라는 논리 경로로 표시될 수 있다.
- 첫 heading이 H4~H6으로 시작하면 실패한다. H1은 아래 Warning 규칙을 따른다.
- heading level을 한 번에 두 단계 이상 건너뛰지 않는다.
- 코드 블록은 언어를 명시한다.
- 코드 블록은 반드시 닫는다.
- callout marker는 blockquote의 첫 텍스트로만 사용한다.
- 지원하지 않는 callout marker를 사용하지 않는다.
- 본문에 HTML 주석을 사용하지 않는다. 미완성 문서는 `status: draft`로 관리한다.

Warning:

- 코드 블록 밖의 본문 H1. frontmatter `title`과 중복될 수 있으므로 H2/H3 시작을 권장하지만, H1만으로 게시를 차단하거나 자동 H2 변환하지 않는다. 첫 heading이 H1이라는 이유로 다시 실패시키지 않는다.
- published 문서 본문이 비어 있는 경우
- published 문서에 `TODO`, `FIXME`, `임시`, `테스트용` 같은 placeholder 표현이 남은 경우
- published 문서 slug가 `test`, `sample`, `todo`, `draft` 같은 임시값인 경우

H1과 다른 hard fail이 함께 있으면 해당 실패를 해결해야 게시할 수 있다. 레거시 NAS에도 변경된 규칙을 적용하려면 공용 패키지가 포함된 백엔드 이미지의 별도 배포가 필요하다. 비공개 Git 신규 글의 게시를 위해 NAS를 수정하라는 뜻은 아니다.

## Local Validation Commands

다음 명령은 콘텐츠 저장소가 아니라 공개 코드 저장소 `web-tech` 루트에서 실행한다. 합성 검사 통과를 비공개 초안의 직접 검수 완료로 보지 않는다.

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
  - 준비된 콘텐츠의 카드/상세/검색 노출 확인. private-git 발행 입력에서 제외된 draft의 미리보기를 보장하지 않음

현재 고정 release 검증기는 published 글만 준비한다. 비공개 Git의 draft를 원본 상태로 읽는 개발 전용 연결은 아직 없다. 초안을 공개 코드 디렉터리로 복사하거나 `published`로 바꿔 이 제한을 우회하지 않는다. [기존 draft 미리보기의 적용 범위](docs-article-rendering-regression.md#개발-서버에서-draft-보기)를 확인하고 연결 기능은 별도 과제로 검토한다.

## Common Mistakes

- `status`를 빼먹어서 published 기준이 모호해지는 경우
- `slug: test`처럼 임시 slug가 오래 남는 경우
- `updatedAt`을 수정하지 않아 최신성 정보가 틀어지는 경우
- `readMinutes` 없이 카드 메타가 어색해지는 경우
- 콘텐츠 이미지와 UI 이미지를 같은 경로 책임으로 다루는 경우

## Related Docs

- [비공개 Git 작성·발행 절차](docs-private-git-content.md)
- [초안 작성 위치 결정](../architecture/adr-0036-private-git-draft-authoring.md)
- [docs-resource-content-roadmap.md](../architecture/docs-resource-content-roadmap.md)
- [docs-content-authoring-markup-policy.md](../architecture/docs-content-authoring-markup-policy.md)
- [docs-content-authoring-pipeline.md](../architecture/docs-content-authoring-pipeline.md)
- [docs-local-vs-remote-content-policy.md](../architecture/docs-local-vs-remote-content-policy.md)
- [docs-blog-improvement-roadmap.md](../architecture/docs-blog-improvement-roadmap.md)
- [blog-content-api-contract.md](../architecture/blog-content-api-contract.md)
