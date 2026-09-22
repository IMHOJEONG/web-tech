# 검색 키보드 조작과 상세 글 의미 구조 보완

## Summary

키보드 검사에서 발견한 검색 Escape 처리 범위와 상세 글의 본문·제목 누락을 보완한다.

## Changed

- 검색 form 전체에서 Escape를 처리한다. 입력창뿐 아니라 지우기·제출·열기 버튼에서도 패널을 닫고 열기 버튼으로 포커스를 복귀시킨다. 검색어는 유지한다.
- 검색 패널의 `transition-all`을 `opacity, transform` 전환으로 제한한다. 첫 Enter 열기에서 입력 포커스가 실패했고, 브라우저 내 해당 CSS만 교체한 비교 검사에서는 복구됐다. 닫힐 때 예약된 포커스 이동도 취소한다.
- 상세 글 본문을 `main`으로 표시한다. 목차는 본문 밖의 `aside`로 유지한다.
- 렌더러가 본문 `h1` 존재 여부를 반환한다. 기존 제목이 있으면 유지하고, 없을 때만 frontmatter 제목을 화면에 추가한다.
- MDX는 파싱된 노드를 검사하므로 코드 블록의 `#`/`<h1>`과 frontmatter를 본문 제목으로 오인하지 않는다. HTML은 정규화된 콘텐츠의 제목 태그를 확인한다.
- 한국어·영어 검색 키보드 동작과 로컬 상세 의미 구조의 E2E 검사, 로컬·원격 제목 판정 단위 검사를 추가한다.

## Notes

Node 24, 기존 로컬 개발 서버(`127.0.0.1:3001`), Playwright 1.62.1에서 검사했다. 운영 배포 검증 결과가 아니다.

저장소 루트에서 실행:

```bash
pnpm --filter docs test:lib
pnpm --filter docs exec tsc --noEmit --incremental false
pnpm --filter docs exec playwright test e2e/keyboard-accessibility.spec.ts e2e/header-clarity.spec.ts e2e/article-anchor-scroll.spec.ts --workers=2
```

- 전체 라이브러리 163개 통과, 타입 검사와 변경 코드 ESLint 통과.
- Chromium E2E 26개 통과, 화면 크기별 실행 범위에 따른 기존 조건 4개 skip. 한국어·영어, 모바일·태블릿·데스크톱에서 검색 Escape와 상세 본문·제목을 확인했다. 기존 헤더 테마·폭 검사와 목차 스크롤 검사도 통과했다.
- 초기 회귀 실행에서는 검색 첫 Enter 열기의 포커스 실패로 6개가 실패했다. 전환 속성 수정 후 같은 테스트가 통과했다. 테스트 지연이나 강제 입력 포커스로 우회하지 않았다.
- 별도 Playwright 실행으로 Firefox·WebKit × 한국어·영어 × 390/1280px의 8개 조건도 통과했다. 입력·지우기·제출·열기 버튼의 Escape, 포커스 복귀, 상세 `main`/`h1`, 가로 넘침과 런타임 오류를 확인했다. 한국어는 라이트, 영어는 다크 테마였다.
- WebKit의 링크·버튼 탐색은 macOS의 Option+Tab 조합으로 확인했다. 실제 Safari 및 VoiceOver·NVDA 낭독 검사는 실행하지 않았다.
- 제목이 없는 로컬 상세의 모바일 캡처도 확인했다. 기존 제목 중복 방지와 원격 HTML의 제목 판정은 렌더러 단위 검사로 확인했으며, 실제 원격 API 연동을 새로 검증하지는 않았다.

## Open Questions

MDX 사용자 정의 컴포넌트가 내부에서 동적으로 생성하는 제목까지 정적 노드 검사로 판별하지는 않는다. 현재 기본 Markdown 제목과 명시적인 `<h1>`을 대상으로 한다. 이미 여러 `h1`을 가진 글의 작성 오류는 이번 수정에서 재작성하지 않는다.

## Next

수정 배포 후 운영 환경에서 재확인하고, VoiceOver·NVDA 실기기 낭독 검사는 별도로 진행한다. 전체 접근성 적합성 인증을 의미하지 않는다.
