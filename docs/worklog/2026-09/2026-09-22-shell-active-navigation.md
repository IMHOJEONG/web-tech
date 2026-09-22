# 앱 셸의 현재 메뉴 판정 통합

## Summary

Web 상세 문서에서 하단 메뉴는 Feed를 표시하고 drawer에는 선택 항목이 없던 불일치를 수정했다. 세 메뉴가 같은 경로 판정과 메뉴 목록을 재사용한다.

## Changed

- [app-navigation 모델](../../../apps/docs/widgets/app-shell/model/app-navigation.ts)에 메뉴 목록, 키 타입, 경로 판정 함수를 모았다. Header Navigation, MobileBottomNav, MobileNavDrawer는 결과만 사용하고 아이콘과 스타일은 각각 유지한다.
- 전용 상세 경로와 FE category 경로를 먼저 판정한 후 일반 `/docs` fallback을 적용한다. 언어, query, hash, 후행 slash와 경로 세그먼트 경계를 처리한다.
- [기존 앱 셸 설계 문서](../../architecture/docs-app-shell-rationale.md)에 경로별 선택 기준과 비적용 범위를 추가했다. 기존 shell 책임 안의 오류 수정으로 새 ADR은 만들지 않았다.
- [단위 테스트](../../../apps/docs/widgets/app-shell/model/app-navigation.test.ts)를 `test:lib`와 Node 테스트 타입 검사에 연결했다.
- [브라우저 회귀 테스트](../../../apps/docs/e2e/shell-active-navigation.spec.ts)는 한국어/영어, canonical/기존 URL, 메뉴별 단일 선택, 클라이언트 이동과 뒤로가기, hydration 오류를 검사한다.

## Notes

2026-09-22 feature/docs 작업 트리에서 Node 24와 기존 로컬 개발 서버를 사용했다. 원격 배포는 하지 않았다.

```sh
pnpm --filter docs test:lib
pnpm --filter docs typecheck
pnpm --filter docs test:e2e shell-active-navigation.spec.ts --workers=1
```

- 단위 테스트 156개와 전체 docs 타입 검사 통과. 변경한 TS/TSX 파일의 ESLint 검사 통과.
- Chromium 브라우저 테스트 6개 통과: 한국어/영어 × 390/768/1280px. 검색 인덱스, UI/UX 상세, canonical/기존 FE 상세, Mobile 이동과 뒤로가기에서 메뉴 단일 선택을 확인했고 hydration 오류는 없었다.
- 첫 검사에서 루트 경로의 후행 slash 테스트가 `//`를 생성해 실패했고, 상세 페이지에 없는 `main`을 찾는 E2E 가정도 실패했다. 입력과 상세 본문 선택자를 고쳤으며 앱의 검사를 완화한 것은 아니다.
- 기존 상세 URL의 리다이렉트 중 DOM이 잠시 바뀌는 시점에 `isVisible()`로 모바일 여부를 판단해 잘못된 메뉴를 클릭하는 테스트도 보완했다. 실제 viewport 너비로 검사 대상을 정하고 canonical URL 이동 완료와 trigger 표시를 기다린다.
- 별도로 발견한 화면 회전 시 drawer 오버레이 잔류 문제는 이번 변경에 포함하지 않는다. Safari/Firefox 검사는 수행하지 않았다.
- Obsidian 관련 기존 미커밋 변경은 보존한다.

## Open Questions

일반 `/docs` 및 전용 상단 탭이 없는 문서는 기존 Feed 표시를 유지한다. Docs 탭을 추가할지는 별도 제품 결정이다.

## Next

화면 크기가 모바일 메뉴 범위를 벗어나면 열린 drawer를 닫고 오버레이 및 스크롤 잠금을 해제하는 후속 작업이 남아 있다.
