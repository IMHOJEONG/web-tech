# 검색·전체 문서 빈 화면의 번역과 본문 구조 통일

## Summary

영어 검색 빈 화면에 한국어 제목이 나오고 전체 문서 0개 화면에 본문 landmark가 없던 문제를 수정했다. 두 상태 모두 언어에 맞는 제목, `main#main-content`, 복구 링크를 제공한다.

## Changed

- 페이지 조합을 `widgets/docs-index/ui/docs-empty-page.tsx`에 모으고 기존 단독 `EmptyAllDocs`, `EmptySearchResult`를 제거했다. 라우트는 상태에 맞는 widget만 선택한다.
- 검색 0건에서는 추천 검색어와 전체 문서 링크를, 전체 문서 0개에서는 피드 이동 링크를 표시한다. 제목·설명·추천 영역 이름은 ko/en 메시지로 관리한다.
- 기존 검색어 말줄임을 재사용하고 디자인 토큰·포커스 스타일·44px 링크 높이를 적용한다. 새 클라이언트 상태나 이벤트 처리는 추가하지 않는다.
- 공백 query는 검색어 없음으로 정규화하여 전체 문서가 없을 때 동일한 빈 상태로 보낸다. 문서가 있으면 기존 인덱스를 유지한다.
- [TODO](../../todo/todo.md)의 빈 상태 항목을 완료 처리했다. 기존 widget 중심 FSD 방향을 따르는 표시 오류 수정이며 공개 라우팅·API·공용 UI 계약 변경이 없어 새 ADR은 추가하지 않았다.

## Notes

2026-09-23, `feature/docs`의 `0c3f51e` 이후 작업 트리, Node 24에서 확인했다. 명령은 저장소 루트에서 `mise exec --`를 앞에 붙여 실행했다.

- `node --test apps/docs/lib/docs-empty-page.test.ts apps/docs/lib/docs-search-page-state.test.ts`: 14개 통과(부모 테스트 포함). 실제 widget·번역·i18n Link를 서버 렌더링해 ko/en에서 검색 0건·전체 0개·공백 검색어의 main/h1 단일성, 본문 id, 복구 링크를 확인한다. 기존 문서 파일을 삭제하거나 원격 응답을 변경하지 않는다.
- 서버 렌더링 테스트는 저장소의 esbuild 방식으로 TSX/alias를 컴파일한다. Next.js 밖에서 해석하지 못하는 next-intl navigation의 확장자 없는 import는 테스트 번들에서 해석하고, 간접 의존성 `use-intl`은 next-intl 위치에서 로드한다. 앱의 의존성·모듈 설정을 바꾸거나 링크를 가짜로 대체하지 않는다.
- `DOCS_E2E_PORT=3116 pnpm --filter docs exec playwright test e2e/docs-empty-state.spec.ts --workers=1`: 12개 통과. 원격 목록을 끈 개발 서버, ko/en × Chromium 모바일·태블릿·데스크톱에서 제목 번역, 본문 구조, 추천어 클릭, 복구 링크 Enter, 긴 검색어의 가로 넘침을 검사했다.
- 변경 TS/TSX의 ESLint, `pnpm --filter docs typecheck:node-test` 통과. 원격 콘텐츠와 Better Stack 전송을 끈 `pnpm --filter docs build`에서 콘텐츠 16개 검사·TypeScript·정적 페이지 28개 생성 통과.

전체 문서 0개는 서버 마크업 테스트이며 실제 문서를 비운 Next 서버의 브라우저 E2E가 아니다. 실제 스크린 리더 낭독·운영 배포·원격 서버 장애의 전체 흐름은 이번 범위에서 확인하지 않았다.

## Open Questions

헤더·본문·URL·API의 검색어 길이 정책 통일과 검색 결과 페이지네이션 확대는 별도 작업이다.

## Next

다음 우선순위는 검색 입력 정규화와 길이 정책 통일이다. 이번 작업은 커밋·푸시하지 않았다.
