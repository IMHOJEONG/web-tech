# 스트리밍 문서 인덱스의 준비 상태

## 개념

보이는 컨트롤이 반드시 최종 화면의 컨트롤은 아니다. Suspense fallback은 콘텐츠가 도착하면 교체될 수 있다. 브라우저의 native details는 hydration 전에도 열릴 수 있지만 그 열림 상태가 교체된 노드에 이전된다는 뜻은 아니다.

## 프로젝트에서 배운 점

문서 목록의 pending UI와 완성 화면은 같은 필터·선택 칩을 렌더링한다. 따라서 visible 또는 칩 개수만 확인하면 곧 제거될 골격을 준비 완료로 오인할 수 있다. 테스트는 최종 `docs-index-results`를 포함하는 visible main에서 필터를 찾고 URL과 실제 선택 칩을 함께 확인한다.

이는 이 화면의 결과 도착 조건이지 전체 페이지의 hydration 완료 신호가 아니다. 이전 화면의 결과가 남는 전환에서는 새 URL만 확인하지 말고 새 결과의 선택 상태도 확인해야 한다.

## 적용 조건과 주의점

- native summary를 열고 Enter로 닫는 검사는 새 화면의 열림·focus를 명시한다. 이전 details가 열린 채 유지된다는 제품 계약을 추가하지 않는다.
- React 소유 DOM을 직접 바꾸거나 임의 sleep·force 클릭·실패 클릭 반복으로 안정화하지 않는다.
- 응답 보류 fixture는 실제 Next HTML을 그대로 전달한다. hidden segment 경계는 버전별 구현 세부사항이므로 형식이 달라지면 실패하고 재검토한다.
- 원격 첫 실패 trace가 없으므로 실제 호출자까지 확정하지 않는다. 로컬에서 증명한 selector 결함과 운영 장애를 구분한다.

## 관련 정책과 검증

- [검증·실패 이력과 재현 명령](../../verification/resilience/2026-10-27-docs-filter-readiness.md)
- [로딩 UX 정책](../../architecture/docs-loading-ux-policy.md)
- [별도 스켈레톤·DOM 소유권 설명 PR #67](https://github.com/IMHOJEONG/web-tech/pull/67)
