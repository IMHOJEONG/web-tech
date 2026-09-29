# 문서 페이지 이동의 비활성 경계 수정

## Summary

첫·마지막 페이지의 비활성 이전·다음이 Enter로 실행되던 문제를 수정했다. 마지막 페이지에서 URL만 범위 밖으로 이동하던 동작을 차단한다.

## Changed

`DocsPageNavigationLink`로 이전·다음 표시를 분리했다. 이동 가능한 경우에만 기존 i18n Link를 렌더링한다. 경계에서는 href·이벤트·tabIndex 없는 span을 렌더링하고 `role="link"`, `aria-disabled="true"`로 비활성 상태를 전달한다. CSS로 입력만 막는 방식이나 클라이언트 이벤트 취소에 의존하지 않는다.

페이지 번호, 페이지 범위 계산, query 생성 함수는 유지한다. UI 계층 내부의 오류 수정으로 라우팅·공용 UI 계약 변경은 없어 별도 ADR은 추가하지 않았다. [이전 재현 결과](../../verification/accessibility/2026-09-23-docs-code-ux-review.md#페이지-이동-후속-점검)는 수정 전 증거로 보존한다.

## Notes

2026-09-23, `feature/docs`의 `fd41450` 이후 작업 트리, Node 24에서 실행했다. 명령은 저장소 루트에서 `mise exec --`를 앞에 붙여 실행했다.

- `DOCS_E2E_PORT=3116 pnpm --filter docs exec playwright test e2e/docs-index-pagination.spec.ts e2e/docs-index-navigation.spec.ts --workers=1`: 21개 통과, 모바일 전용 검사의 다른 기기 조합 6개는 의도적 생략. 원격 목록이 없는 로컬 개발 서버를 사용했다.
- 신규 회귀 검사는 ko/en × 모바일·태블릿·데스크톱에서 양쪽 경계의 href 부재, 클릭·Enter 이동 없음, 비활성 컨트롤의 포커스 불가와 탭 순서 제외, 정상 이전·다음 이동과 정렬 유지까지 확인한다.
- 기존 브라우저 검사는 필터·정렬 URL 유지, 검색 중 필터 변경, 필터 변경 시 페이지 초기화를 확인한다.
- `node --test apps/docs/widgets/docs-index/model/docs-index-pagination.test.ts apps/docs/widgets/docs-index/model/docs-index-controls.test.ts`: 9개 통과.
- 변경 TS/TSX 파일의 ESLint 경고 없음. 원격 콘텐츠·Better Stack 전송을 끈 `pnpm --filter docs build`에서 콘텐츠 16개 검사, TypeScript와 정적 페이지 28개 생성 통과.

이번 검증은 Chromium 자동화와 빌드 기준이며 실제 VoiceOver/NVDA 낭독, 운영 배포는 확인하지 않았다. `aria-disabled`는 상태 전달용이지 입력 차단 기능이 아니므로, 실제 이동 수단을 제거한 DOM 구조를 함께 검사한다.

## Open Questions

검색 결과 페이지네이션 확대와 페이지 번호 표시 개수 제한은 이번 범위가 아니다.

## Next

배포 후 첫·마지막 페이지의 키보드 이동을 재확인한다. 이번 변경은 커밋·푸시하지 않았다.
