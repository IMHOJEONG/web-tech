# Docs Lightweight Code Block Highlighting

## Context

로컬 MDX 상세 페이지에서는 Vercel runtime timeout을 피하기 위해 Shiki syntax highlighting을 요청 시점에 실행하지 않는다.

이후 코드 블록은 안정적으로 렌더링되었지만, 다음 UX 차이가 남았다.

- 코드 박스는 표시되지만 문법 하이라이팅이 없다.
- 복사 버튼이 없어 긴 예제를 옮겨 쓰기 불편하다.
- 언어 라벨이 헤더처럼 크게 보이면 본문 흐름을 방해한다.

## Changes

- 로컬 MDX `pre/code` 렌더러에 코드 블록 프레임을 추가했다.
- 코드 복사 버튼을 작은 client component로 분리했다.
- 언어 라벨은 코드 블록 우측 하단의 작은 메타 텍스트로 낮췄다.
- Shiki 대신 lightweight highlighter를 추가했다.
  - HTML / MDX / XML tag
  - JS / TS / JSX / TSX / JSON keyword, literal, string, number, comment
  - CSS / SCSS / SASS property, string, number, comment
- 하이라이트 출력은 원본 코드를 HTML escape한 뒤 허용된 token span만 삽입한다.

## Policy

로컬 MDX 상세는 request-time Shiki를 기본으로 사용하지 않는다.

이유:

- 로컬 문서는 원격 콘텐츠 장애 시 fallback 역할을 한다.
- fallback 문서는 빠르고 안정적으로 열리는 것이 우선이다.
- syntax highlighting은 품질 개선 요소지만, 페이지 전체 timeout을 감수할 정도의 핵심 기능은 아니다.

대신 로컬 MDX 상세는 lightweight highlighter를 사용한다.

- 런타임 초기화 비용이 작아야 한다.
- 지원 범위는 블로그에서 자주 쓰는 언어부터 넓힌다.
- escape 안전성이 하이라이팅 정교함보다 우선이다.

## Follow-up

- `highlightCode()` escape와 언어별 token 출력을 테스트로 고정한다.
- 원격 HTML 코드 블록도 같은 UX를 쓸지 검토한다.
- 더 정교한 highlighting이 필요하면 build-time Shiki 또는 remote sidecar로 옮긴다.
