# 본문 바로가기와 포커스·명암 대비 개선

## Summary

본문 바로가기, 키보드 포커스·대비, 스크린 리더 사전 구조 검사를 순서대로 개선한다. 실제 음성 낭독 검증은 자동 검사와 구분한다.

## Changed

- 첫 Tab에서만 보이는 한국어·영어 본문 바로가기를 공통 레이아웃에 추가했다. JS 핸들러 없이 native fragment 링크를 사용한다.
- 기존 페이지의 `main`을 공통 `MainContent`로 교체해 ID·프로그램 포커스·고정 헤더 간격을 통일했다. 로딩·오류 화면에도 대상이 있으며 `main`을 중첩하지 않는다.
- 블로그에 한정한 실선 `focus-visible`과 강제 색상 모드의 시스템 포커스 색을 추가했다. 공용 UI 패키지의 토큰은 수정하지 않았다.
- 밝은 모드에서 선택 메뉴·검색 아이콘의 대비가 2.53:1로 측정되어, 글자·아이콘용 `--docs-interactive-text`를 추가했다. 브랜드 주황색과 장식 배경은 유지했다. 검색 placeholder와 목록 검색 제출 버튼도 보완했다.
- 주요 메뉴는 하나의 이름 있는 `nav`, 검색은 구분되는 이름의 `search` 영역으로 제공한다. 검색 결과 직접 진입 시 헤더 검색창이 자동 포커스를 가져가지 않도록 했다.
- 재현 절차와 실제 낭독 체크리스트는 [브라우저·기기 점검 기준](../../runbooks/docs-responsive-browser-device-checklist.md#키보드와-스크린-리더-검사-순서)에 추가했다.

## Notes

- Node 24 환경의 `pnpm --filter docs typecheck`, `pnpm --filter docs lint`, `git diff --check` 통과.
- 실행 중인 로컬 개발 서버에서 아래 Chromium 회귀 검사 45개 통과, 18개는 화면 크기별 조건에 따라 제외됐다. 새 본문 바로가기 검사는 한국어·영어 각각 15개 경로를 모바일·태블릿·데스크톱에서 순회한다.

```sh
pnpm --filter docs exec playwright test \
  e2e/skip-link.spec.ts e2e/shell-focus-contrast.spec.ts \
  e2e/keyboard-accessibility.spec.ts e2e/header-clarity.spec.ts \
  e2e/mobile-drawer-close.spec.ts e2e/mobile-drawer-resize.spec.ts --workers=2
```

- Firefox·WebKit은 별도 Playwright 점검으로 `/ko/docs?q=react`, `/en/docs?q=react`의 390px·1280px 조합 8개에서 링크 포커스와 Enter 후 `main` 포커스를 확인했다. WebKit은 macOS 링크 탐색에 맞춰 Option+Tab을 사용했다.
- 명암 대비 검사는 주요 메뉴와 헤더 검색 컨트롤의 단색 배경을 대상으로 한다. 전체 사이트의 대비나 WCAG 적합성을 보증하지 않는다.
- 문서 not-found 경로는 검사에 포함한다. 공통 레이아웃 밖의 알 수 없는 최상위 주소는 기존 Next.js 기본 404를 사용하며 이번 변경 대상이 아니다.
- 프로덕션 빌드·배포 및 실제 스크린 리더 음성 검사는 수행하지 않았다.

## Open Questions

VoiceOver·NVDA의 실제 낭독, 페이지 전환 안내의 음성 품질은 미검증이다. 접근성 트리와 키보드 검사만으로 전체 WCAG 적합성을 주장하지 않는다. 로딩 fallback에 포커스를 둔 직후 콘텐츠가 교체되는 경우의 낭독 연속성도 실기기로 확인한다.

## Next

수동 체크리스트로 실제 낭독을 검증하고 결과를 남긴다. 커밋·배포는 별도 요청 시 진행한다.
