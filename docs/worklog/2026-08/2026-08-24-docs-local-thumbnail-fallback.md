# Docs Local Thumbnail Fallback

## Context

로컬에서 작성한 일부 문서가 목록 카드에서 썸네일 없이 표시되는 문제가 있었다.

원인:

- 최근 로컬 문서 frontmatter에 `thumbnail` 값이 없는 경우가 많았다.
- 일부 카드 컴포넌트는 fallback을 쓰지만, 카테고리 카드처럼 `thumbnail ?? ''`로 빈 문자열을 넘기는 곳도 있었다.
- 원격 문서는 payload에서 thumbnail을 받을 수 있지만, 로컬 문서는 작성자가 직접 frontmatter에 넣지 않으면 이미지가 없었다.

## Changes

- 로컬 문서 전용 기본 썸네일을 추가했다.
  - `/default/local-document.svg`
- 기본 썸네일 상수를 분리했다.
  - `DEFAULT_DOCUMENT_THUMBNAIL`
  - `DEFAULT_LOCAL_DOCUMENT_THUMBNAIL`
- 로컬 문서 파서에서 `thumbnail`이 없으면 로컬 전용 기본 썸네일을 자동 주입한다.
  - `get-document`
  - `get-category`
  - `get-search-data`
- 목록 카드 fallback에서 빈 문자열을 제거하고 기본 썸네일을 사용하도록 정리했다.

## Policy

로컬 문서:

- 개별 문서에 고유 이미지가 있으면 frontmatter `thumbnail`을 사용한다.
- `thumbnail`이 없으면 `/default/local-document.svg`를 사용한다.

원격 문서:

- 원격 payload의 `thumbnail`을 우선 사용한다.
- 원격 payload에도 없으면 일반 기본 이미지 fallback을 사용한다.

## Follow-up

문서 성격별 기본 썸네일이 더 필요해지면 channel 단위 fallback을 추가할 수 있다.

예:

- Web
- Mobile
- UI/UX
- Computer Science
- Infra
