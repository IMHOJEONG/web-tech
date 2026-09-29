# UI/UX 예시 카드 제거와 실제 문서 연결

## Summary

UI/UX 화면에서 존재하지 않는 글을 실제 문서처럼 보여주던 예시 카드를 제거했다. 로컬 공개 글 2개 기준으로 예시 5개가 사라지고 실제 문서 카드 2개만 표시된다.

## Changed

- `widgets/content-hub/model/uiux-hub-docs.ts`로 표시 데이터 선택을 분리했다. 제목·목적지가 없는 항목과 중복 목적지를 제외하고 기존 정렬을 유지한다.
- 실제 문서만 기존 배치(상단 3개, 네 번째 글, 추가 3개)에 넣는다. 부족한 자리를 채우거나 빈 섹션을 렌더하지 않는다.
- 전체 0개이면 한국어·영어 빈 상태와 전체 문서 탐색 링크를 제공한다. 존재하지 않는 제목·요약과 위치에 따른 임의 분류 대신 문서의 제목·요약·주제를 사용한다. 이미지가 없는 실제 글의 대체 이미지는 유지한다.
- 추가 로드처럼 보이던 CTA를 별도 `UI/UX 피드 보기` 링크로 바꾸고 아래 화살표를 제거했다. 문서 상세 링크와 피드 이동을 구별한다.
- [분석 보고서](../../verification/accessibility/2026-09-23-docs-code-ux-review.md)의 UI/UX 항목과 [TODO](../../todo/todo.md)를 후속 처리했다. 기존 검증 결과 자체는 수정하지 않는다.

## Notes

2026-09-23, Node 24, `feature/docs` 작업 트리에서 확인했다. 명령은 저장소 루트 기준이며 `mise exec --`로 실행했다.

- `node --test apps/docs/widgets/content-hub/model/uiux-hub-docs.test.ts`: 10개 통과. 0·1·2·3·4·5·7·8개 데이터, 누락 필드, 중복 목적지, 로컬·원격 메타데이터를 검사했다.
- `pnpm --filter docs typecheck`: 통과. 변경한 TS/TSX 파일의 ESLint도 경고 없이 통과했다.
- `DOCS_E2E_PORT=3116 pnpm --filter docs exec playwright test e2e/uiux-compact-cards.spec.ts --workers=1`: 13개 통과, 중복 너비 검사 2개 의도적 생략. ko/en, light/dark, Chromium 모바일·태블릿·데스크톱에서 실제 카드 수, 섹션 생략, 링크 목적지, 마우스·Enter 이동, 이미지 크기와 카드 넘침을 확인했다.
- 원격 콘텐츠와 Better Stack 전송을 끈 `pnpm --filter docs build`: 콘텐츠 16개 검사, TypeScript, 정적 페이지 28개 생성 통과.

E2E는 로컬 공개 문서 2개를 사용한다. 0·1·7개는 데이터 선택 단위 테스트이며 해당 개수의 화면을 브라우저에서 직접 확인한 것은 아니다. 실 NAS 응답과 운영 배포는 이번 검사 대상이 아니다. API·캐시·공용 UI 계약 변경 없이 기존 표시 오류를 수정했으므로 별도 ADR은 추가하지 않았다.

## Open Questions

현재 첫 7개 이후 문서는 기존처럼 피드에서 찾는다. UI/UX 자체의 페이지네이션이나 주제 필터는 별도 개선 범위다.

## Next

배포 시 실제 원격 문서 수에서도 예시 카드가 없고 각 제목에 맞는 상세로 연결되는지 확인한다. 이번 요청에서는 커밋·푸시하지 않았다.
