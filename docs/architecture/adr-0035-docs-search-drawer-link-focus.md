# ADR-0035: 검색 Drawer의 결과 탐색에 실제 링크 포커스를 사용한다

## 상태와 범위

- 상태: 적용 중
- 대상: docs 헤더 검색 Drawer의 결과 의미 구조와 키보드 포커스. 로컬 구현 상태다.
- 결정일: 2026-11-21
- 최종 검토: 2026-11-23
- 대체: [ADR-0031](adr-0031-docs-search-drawer.md)의 combobox와 결과 포커스 항목.

## 배경

Drawer의 결과는 문서를 여는 앵커다. 결과에 옵션 역할을 부여한 이전 구현에서는 Tab으로 실제 포커스를 옮기는 동시에 입력에 가상 선택이 남았다. 결과를 거쳐 입력으로 돌아와 Enter를 누르면 이전 문서가 열릴 수 있었다. 검증과 재현은 [검색 접근성 보고서](../verification/accessibility/2026-11-21-search-input-audit.md)에 남겼다.

## 결정

레이블이 있는 검색 입력과 실제 링크를 담은 목록을 기존 모달에 배치한다. Tab과 Shift+Tab은 기본 순서를 따른다. 수식 키와 IME 조합을 제외하고, 검색 입력의 위·아래 방향키는 각각 마지막·첫 결과에 포커스를 주며 링크의 방향키는 목록을 순환한다. 입력 Enter는 전체 검색을 제출하고 링크 Enter는 해당 문서를 연다. 새 탭 열기 등 링크의 브라우저 동작을 사용한다.

결과 갱신이 현재 포커스된 링크를 제거해 포커스가 문서 본문으로 떨어질 때는 열린 Drawer의 입력으로 복귀한다. 그 외에는 현재 포커스를 유지한다. 모달의 닫기와 트리거 복귀는 Sheet 계약을 따르고 검색 입력·URL 계약은 [ADR-0007](adr-0007-search-input-contract.md)을 따른다.

## 대안과 영향

표준 combobox는 입력에 DOM 포커스를 남겨 선택 상태를 관리한다. 팝업의 자손이 Tab 순서에서 제외되므로 결과를 일반 문서 링크로 직접 탐색해야 하는 요구와 다르다. 실제 링크 목록은 Tab 정지점이 결과 수만큼 늘어난다. Drawer 미리보기는 최대 8개이며 기존 방향키 탐색을 함께 제공한다. [WAI-ARIA Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) · [WAI-ARIA Link](https://www.w3.org/WAI/ARIA/apg/patterns/link/)

## 관련 문서

- [검색 Drawer와 경량 자동완성](adr-0031-docs-search-drawer.md)
- [검색 접근성 보고서](../verification/accessibility/2026-11-21-search-input-audit.md)
