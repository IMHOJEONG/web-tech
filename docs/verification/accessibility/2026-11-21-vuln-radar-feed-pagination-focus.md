# Feed 페이지 이동 포커스 검증

## 대상과 조건

2026-11-21 KST에 `80c135a3`와 로컬 수정을 비교했다. 실제 Vite `/feed`에 합성 응답을 제공했다. Chromium 151.0.7922.34·Firefox 153.0·WebKit 26.5, 390·1280px의 각 6조건을 검사했다. [KAN-83](https://web-tech-service.atlassian.net/browse/KAN-83)

## 재현 방법

페이지 1에서 `다음`에 포커스를 둔 뒤 Enter를 누른다. 페이지 2의 응답을 보류하고 포커스, 대기 문구와 버튼 상태를 확인한다. 대기 중과 마지막 페이지에서 Enter·Space·클릭 이벤트를 보낸 뒤 추가 요청 여부를 검사한다. 마지막 페이지에서 역방향 Tab으로 `이전`에 이동하고, 첫 페이지로 돌아온 다음 Tab으로 `다음`에 이동한다. macOS WebKit에서는 버튼까지 순회하는 Option+Tab과 Option+Shift+Tab을 사용했다. [Apple Safari 단축키](https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac)

## 결과와 증거

변경 전에는 페이지 탐색이 사라져 로딩 중과 완료 후 포커스가 문서 본문으로 이동했다. 변경 후에는 로딩 중과 마지막 페이지에서 `다음` 버튼이 포커스와 시각적 표시를 유지했다. 비활성 버튼은 `aria-disabled`를 표시하고 순차 Tab 진입을 건너뛰며, 키보드와 클릭 이벤트가 새 요청을 만들지 않았다. `이전`으로 돌아가는 키보드 흐름도 여섯 조건에서 확인했다. 앱 테스트 36개, 타입 검사와 린트가 통과했다. [정제 증거](../artifacts/2026-11-21-vuln-radar-feed-pagination-focus.json)

격리 PostgreSQL·Nest·Chromium을 사용한 통합 검사 26그룹도 통과했다. 기존 실행기의 페이지 문구 단언 세 곳을 현재 UI에 맞췄다. 임시 자원 정리를 확인하고 원시 보고서와 캡처는 저장소 밖에 보관했다. [통합 검증 절차](../../runbooks/vuln-radar-local-integration-verification.md)

## 한계와 후속 작업

Safari 앱과 실제 스크린리더, 모바일 실기기, 요청 전체 실패 시 포커스 복구와 운영 환경은 미검증이다.

## 관련 문서

- [작업 기록](../../worklog/2026-11/2026-11-21-vuln-radar-feed-pagination-focus.md)
- [W3C 키보드 인터페이스 지침](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
