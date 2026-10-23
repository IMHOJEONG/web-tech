# 실제 탐색에 연결된 모션의 로컬 검증

## 대상과 조건

- 추적: [KAN-31](https://web-tech-service.atlassian.net/browse/KAN-31)
- 기준: main `16c51e9` 위의 `codex/docs-article-media-policy-20261023` 미커밋 작업 트리.
- 범위: 루트·Feed의 시연 연결 제거, 실제 Feed·Web/Mobile 허브·Docs 목록의 등장과 hover/focus 보완.
- 환경: Node 24.12.0·pnpm 12.14.0, Next 개발 서버, 원격 색인 제외. Chromium 320/390/1280px·WebKit 390px 에뮬레이션.
- 미디어 제작 도구·녹화본·비연결 플레이어는 보존한다. 공개 글·의존성·NAS·CDN·자격 증명·배포는 변경하지 않는다.

## 재현 방법

이미 로컬 서버가 있으면 중복 실행하지 않는다. Chrome에 `http://127.0.0.1:3001/ko/feed`를 열어두었다.

```sh
BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false DOCS_E2E_PORT=3001 mise exec -- pnpm --filter docs dev:e2e
mise exec -- pnpm --filter docs test:motion
mise exec -- pnpm --filter docs typecheck
```

1. Feed의 최근 글에서 WEB·ALL을 번갈아 선택한다. Web 허브의 React 필터, Docs의 섹션 필터도 같은 패턴이다.
2. 데스크톱에서는 카드에 마우스를 올린다. 카드가 2px 올라가지만 이미지나 텍스트 자체는 확대하지 않는다.
3. Tab으로 카드를 선택한다. 색·focus ring은 보이고 위치는 움직이지 않는다. 등장 중 focus하면 즉시 완성 상태를 보여준다.
4. DevTools에서 reduced-motion을 reduce로 바꾸면 등장·전환이 제거된다. 선택 상태와 focus 표시는 유지한다.

## 결과와 증거

결과 컨테이너의 key만 필터·검색·정렬·페이지 상태에 연결했다. 입력과 필터를 remount하지 않으며 전체 페이지 전환·퇴장 대기를 추가하지 않았다.
등장 wrapper와 상호작용 링크를 분리해 fill-mode의 transform이 hover 이동을 덮지 않도록 했다.
기존 색·그림자 토큰을 유지했고 공용 UI나 모션 라이브러리를 변경·추가하지 않았다.

전용 Chromium 320/390/1280px·WebKit 390px의 모션 28개가 재시도 없이 통과했다.
docs 전체 타입과 변경 소스 lint도 통과했다. 기존 영상 검사의 통과 수를 이번 결과로 재사용하지 않았다.
기존 카드·허브 필터·문서 페이지네이션 E2E도 모바일/데스크톱에서 44개 통과했다. 모바일 실행의 desktop 전용 2개는 의도된 skip이다.
[실행 요약·실제 animationstart·duration/delay·소스 해시](../artifacts/2026-10-23-content-interaction-motion.json),
[390px 결과 화면](../artifacts/2026-10-23-content-motion-390.png),
[데스크톱 결과 화면](../artifacts/2026-10-23-content-motion-desktop.png)을 보관한다.

초기 검사에서 페이지네이션 결과의 필드 이름을 잘못 참조한 타입 오류를 고쳤다.
focus 시 등장 효과가 즉시 없어지는 의도 때문에 duration 검사를 focus 이전으로 옮겼다.
Docs의 숨겨진 streaming tree와 실제 controls를 중복 선택하던 검사는 기존 visible-filter helper로 수정했다.
테스트 타임아웃을 늘리거나 focus/reduce 요구 조건을 완화하지 않았다.
루트의 자식 제목·구분선에도 reduce 전환 제거를 명시했다. 단순 class 존재 여부가 아니라 computed style로 검사했다.

## 한계와 후속 작업

- 실제 휴대전화·iOS Safari·Firefox·스크린 리더와 운영 CDN/배포는 미검증이다.
- 기본 글자 200%·320/390/844px 레이아웃 검사는 실제 브라우저 zoom·회전 센서 검사와 다르다.
- 첫 화면 전체를 숨기거나 LCP 후보에 새 등장 효과를 추가하지 않았다. production LCP/CLS 개선을 측정한 것은 아니다.
- 시연 도구·파일은 삭제하지 않았지만 실제 루트·Feed에서 표시하거나 요청하지 않는다. 향후 본문 영상 적용 여부는 별도 검토한다.
- 필터로 목록 높이와 카드 배치가 달라지는 것 자체를 보간하지 않는다. CSS 등장·색·테두리·작은 transform만 사용한다.

## 관련 문서

- [모션 정책](../../architecture/docs-motion-interaction-policy.md)
- 이전 미디어 실험 보고서와 녹화본은 로컬에 별도 보존하며 이번 모션 커밋에는 포함하지 않는다.
- [작업 기록](../../worklog/2026-10/2026-10-23-content-interaction-motion.md)
