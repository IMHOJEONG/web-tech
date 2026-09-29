# ADR 후속 점검과 About·검색·문서 목록 개선

## Summary

요청 순서에 따라 운영 접근성·공용 UI 외부 재사용 상태를 먼저 확인하고 About 정보 정리, 검색 입력 계약 통일, DocsIndex 역할 분리를 적용했다. 배포 확인과 로컬 구현 완료를 구분한다.

## Changed

- 운영 접근성: [후속 검증](../../verification/accessibility/2026-09-23-deployed-shell-recheck.md)에 20개 통과·4개 조건부 제외를 기록했다. 이전 실패 결과는 보존한다.
- About: 확인되지 않은 아카이브 시작 날짜와 직함을 제거했다. 모바일 메뉴도 같은 직함을 참조하므로 함께 제거했고 번역 오류 회귀 검사를 추가했다. 가짜 날짜·직함으로 바꾸지 않았다.
- 검색: shared 순수 함수와 feature 훅으로 헤더·본문·직접 URL·API의 40 code point·NFC·공백·첫 q 규칙을 공유한다. 입력 중 공백을 유지하고 조합 종료 시 제한한다. API 응답 모양은 유지하지만 초과 검색어의 의미가 바뀌므로 [ADR-0007](../../architecture/adr-0007-search-input-contract.md)을 추가했다.
- 목록: DocsIndexStats·DocsIndexSections·DocsIndexPagination을 서버 컴포넌트로 추출했다. DocsIndex는 353줄에서 202줄로 줄었으며 검색 순서·빈 상태·정렬 조건·페이지 이동은 기존 모델에 유지한다. 검색 결과 페이지네이션을 새로 추가하지 않았다.
- [TODO](../../todo/todo.md)에 완료 범위와 후속 과제를 나눴다. Obsidian 연동 미커밋 변경은 건드리지 않았다.

### 공용 UI 외부 재사용 점검

| 확인한 코드                | 결과와 필요한 준비                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/package.json` | `private: true`, 버전 `0.0.0`. 외부 배포 채널과 릴리스 기준은 미확정이다.                                                                                 |
| React 의존성               | peerDependencies 없이 일반 dependencies로 선언되어 있다. 외부 소비 앱과 React 인스턴스·지원 버전 계약을 먼저 정해야 한다.                                 |
| exports·빌드               | lib/components의 dist JS·타입 export와 tsc 빌드는 존재한다. 외부 tarball의 포함 파일·catalog 변환 결과·라이선스·설치 후 import는 미검증이다.              |
| CSS 소비                   | 앱 global.css가 `packages/ui/components`와 `lib`의 저장소 상대 경로를 source로 스캔한다. 스타일 export와 독립 소비 앱의 토큰·클래스 생성 계약이 필요하다. |
| 외부 소비처                | 실제 저장소·React/빌드 환경 목록이 없다. 외부 모노레포를 읽거나 바꾸지 않았으며 패키지도 게시하지 않았다.                                                 |

결론: 내부 workspace 재사용과 외부 패키지 배포 준비는 다르다. 먼저 실제 소비처 하나와 배포 채널을 정한 뒤 peer·exports·CSS·버전 계약을 별도 ADR로 결정하고 독립 fixture에서 설치·빌드·키보드 검증을 수행한다. 현재 `private`를 임의 해제하거나 레지스트리를 선택하지 않는다.

## Notes

검증 환경은 Node 24, `feature/docs`의 `a3cc08d` 이후 작업 트리다. 명령은 저장소 루트에서 `mise exec --`로 실행했다.

- `node --test apps/docs/lib/search-query.test.ts apps/docs/lib/search-api-response.test.ts apps/docs/lib/docs-search-page-state.test.ts apps/docs/widgets/docs-index/model/docs-index-controls.test.ts apps/docs/widgets/docs-index/model/docs-index-summary.test.ts apps/docs/widgets/docs-index/model/docs-index-pagination.test.ts`: 23개 통과.
- `pnpm --filter docs typecheck:node-test`, `pnpm --filter docs typecheck`: 통과. 최초 pretypecheck는 sandbox 쓰기 제한으로 실패했으며 승인된 정상 권한 실행에서 통과했다.
- `DOCS_E2E_PORT=3116 pnpm --filter docs exec playwright test e2e/about-author.spec.ts e2e/search-query-policy.spec.ts e2e/docs-index-pagination.spec.ts e2e/docs-index-navigation.spec.ts --workers=1`: 최종 42개 통과·6개 조건부 제외. 모바일 전용 목록 탐색 검사는 태블릿·데스크톱에서 제외된다.
- 브라우저 재검사는 원격 콘텐츠·외부 로그 전송을 끈 별도 서버에서 수행했다. 초기 검사 중 제거한 직함 키를 모바일 메뉴가 참조하는 것을 발견해 함께 수정했다. 새 검색 테스트는 실제 결과가 없는 검색어에 입력 폼을 기대한 가정도 바로잡았다.
- 원격 콘텐츠 API base URL·token과 Better Stack 설정을 비우고 `BLOG_CONTENT_INCLUDE_REMOTE_INDEX=false`, `DOCS_ENABLE_REACT_INSPECTION=false`로 실행한 `pnpm --filter docs build`: 콘텐츠 16개·타입 검사·정적 페이지 28개 생성 통과.
- 변경 TS/TSX의 ESLint와 변경 파일 Prettier 검사 통과. 문서 검사는 기존 validator의 `validate`에 HEAD와 이번 작업 트리 파일만 제공해 통과했다. 인덱스는 변경하지 않았고 Obsidian 관련 미커밋 문서는 검사 대상에서 제외했다.

## Open Questions

- 실제 스크린 리더·모바일 OS IME·production Tooltip 검증은 남아 있다. 합성 composition 이벤트 검사는 실제 입력기 전체 검증이 아니다.
- JavaScript 비활성 브라우저에서는 개발 서버의 기존 Suspense loading이 남았다. 해당 시도를 성공한 검색 회귀 검사로 집계하지 않았으며 프로덕션의 JS 비활성 지원은 별도 검증한다.
- 과거 접근성 CSS 누락의 원인과 외부 UI 소비처의 호환성은 이번 결과만으로 확정하지 않는다.
- About 이외의 모든 편집 문구와 미사용 시안 제거까지 완료한 것은 아니다.

## Next

외부 UI의 첫 소비 저장소·배포 채널을 확정한 뒤 패키지 배포 ADR을 작성한다. 기능별 커밋과 검증 문서를 구분해 반영하며, 푸시 후 배포 상태는 로컬 검증 결과와 별도로 확인한다.
